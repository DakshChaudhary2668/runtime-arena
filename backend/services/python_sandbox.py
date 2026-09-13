"""Subprocess-backed, deterministic Flight 101 Python verifier."""

import json
import os
import platform
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from dataclasses import asdict
from functools import lru_cache
from pathlib import Path

from challenges.flight_101 import get_challenge


MAX_SOURCE_BYTES = 64 * 1024
MAX_OUTPUT_BYTES = 64 * 1024
RUNNER = Path(__file__).with_name("python_runner.py")
REPOSITORY = Path(__file__).resolve().parents[2]


@lru_cache(maxsize=1)
def _macos_sandbox_available():
    if platform.system() != "Darwin" or not shutil.which("sandbox-exec"):
        return False
    try:
        probe = subprocess.run(
            ["sandbox-exec", "-p", "(version 1) (allow default)", "/usr/bin/true"],
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            env={"PATH": "/usr/bin:/bin"}, timeout=1, check=False,
        )
        return probe.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def _confine_command(work, command):
    interpreter = Path(sys.executable).resolve()
    if not _macos_sandbox_available():
        return command
    # macOS seatbelt adds filesystem/network confinement to the subprocess.
    # Its temp directory is the sole writable location; the repository is unreadable.
    user_home = Path.home().resolve()
    home_rule = (f'(deny file-read* (subpath "{user_home}"))',) if not interpreter.is_relative_to(user_home) else ()
    profile = "\n".join((
        "(version 1)",
        "(allow default)",
        "(deny network*)",
        "(deny process-fork)",
        f'(deny file-read* (subpath "{REPOSITORY}"))',
        *home_rule,
        "(deny file-write*)",
        f'(allow file-write* (subpath "{work.resolve()}"))',
    ))
    return ["sandbox-exec", "-p", profile, *command]


STATUS_LABELS = {
    "ACCEPTED": "ACCEPTED",
    "FAILED_TESTS": "FAILED TESTS",
    "SYNTAX_ERROR": "SYNTAX ERROR",
    "RUNTIME_ERROR": "RUNTIME ERROR",
    "TIMEOUT": "TIME LIMIT EXCEEDED",
    "TIME_LIMIT_EXCEEDED": "TIME LIMIT EXCEEDED",
    "OUTPUT_LIMIT": "OUTPUT LIMIT EXCEEDED",
    "OUTPUT_LIMIT_EXCEEDED": "OUTPUT LIMIT EXCEEDED",
    "INVALID_RETURN": "INVALID RETURN",
    "SANDBOX_ERROR": "SANDBOX ERROR",
}


def get_sandbox_mode() -> str:
    """Internal diagnostic reporting isolated hackathon execution capability."""
    return "macos_os_sandbox" if _macos_sandbox_available() else "subprocess_limits_only"


def _runner_command(work, verdict_path):
    command = [str(Path(sys.executable).resolve()), "-I", "-S", "-B", str(work / "runner.py"), str(verdict_path)]
    return _confine_command(work, command)


def _failure(status, error_type, summary, challenge=None, elapsed=0, stdout="", stderr=""):
    public_total = len(challenge.public_tests) if challenge else 0
    hidden_total = len(challenge.hidden_tests) if challenge else 0
    return {
        "status": status,
        "passed": False,
        "verdict_label": STATUS_LABELS.get(status, status.replace("_", " ")),
        "sandbox_mode": get_sandbox_mode(),
        "error_type": error_type,
        "error_summary": summary,
        "testsPassed": 0,
        "totalTests": public_total + hidden_total,
        "publicTests": {"passed": 0, "total": public_total, "results": []},
        "hiddenTests": {"passed": 0, "total": hidden_total, "results": []},
        "executionTime": round(elapsed, 3),
        "time": f"{elapsed:.3f}",
        "memory": "0",
        "stdout": stdout,
        "stderr": stderr or summary,
    }


def _read_capped(path):
    with open(path, "rb") as output:
        return output.read(MAX_OUTPUT_BYTES).decode("utf-8", errors="replace")


def _valid_verdict(result, challenge):
    if not isinstance(result, dict) or result.get("status") not in {
        "ACCEPTED", "FAILED_TESTS", "SYNTAX_ERROR", "RUNTIME_ERROR", "OUTPUT_LIMIT",
        "OUTPUT_LIMIT_EXCEEDED", "TIMEOUT", "TIME_LIMIT_EXCEEDED", "INVALID_RETURN"
    }:
        return False
    if type(result.get("passed")) is not bool:
        return False
    if result["passed"] != (result["status"] == "ACCEPTED"):
        return False
    for group, cases in (("publicTests", challenge.public_tests), ("hiddenTests", challenge.hidden_tests)):
        section = result.get(group)
        if not isinstance(section, dict) or section.get("total") != len(cases):
            return False
        items = section.get("results")
        if not isinstance(items, list) or len(items) > len(cases):
            return False
        if any(type(item.get("passed")) is not bool for item in items if isinstance(item, dict)):
            return False
        if any(not isinstance(item, dict) for item in items):
            return False
        if any(not isinstance(item.get("name"), str) for item in items):
            return False
        if section.get("passed") != sum(item["passed"] for item in items):
            return False
        if group == "hiddenTests" and any(set(item) != {"name", "passed"} for item in items):
            return False
    if result.get("testsPassed") != result["publicTests"]["passed"] + result["hiddenTests"]["passed"]:
        return False
    if result.get("totalTests") != len(challenge.public_tests) + len(challenge.hidden_tests):
        return False
    if result["passed"] and result["testsPassed"] != result["totalTests"]:
        return False
    return True


def execute_python_mission(mission_id, source_code):
    challenge = get_challenge(mission_id)
    if not challenge:
        return _failure("SANDBOX_ERROR", "UNKNOWN_MISSION", "Unknown Flight 101 mission")
    if not isinstance(source_code, str) or len(source_code.encode("utf-8")) > MAX_SOURCE_BYTES:
        return _failure("SANDBOX_ERROR", "SOURCE_LIMIT", "Source exceeds 64 KB", challenge)

    start = time.monotonic()
    try:
        with tempfile.TemporaryDirectory(prefix="runtime-flight-") as working_dir:
            work = Path(working_dir)
            shutil.copyfile(RUNNER, work / "runner.py")
            (work / "submission.py").write_text(source_code, encoding="utf-8")
            (work / "challenge.json").write_text(json.dumps(asdict(challenge)), encoding="utf-8")
            verdict_path = work / "verdict.json"
            stdout_path = work / "stdout.log"
            stderr_path = work / "stderr.log"
            with open(stdout_path, "wb") as stdout_file, open(stderr_path, "wb") as stderr_file:
                process = subprocess.Popen(
                    _runner_command(work, verdict_path),
                    cwd=working_dir,
                    env={"PATH": "/usr/bin:/bin", "PYTHONHASHSEED": "0", "LANG": "C.UTF-8"},
                    stdin=subprocess.DEVNULL,
                    stdout=stdout_file,
                    stderr=stderr_file,
                    start_new_session=True,
                    close_fds=True,
                )
                try:
                    process.wait(timeout=challenge.timeout)
                except subprocess.TimeoutExpired:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    process.wait()
                    elapsed = time.monotonic() - start
                    return _failure(
                        "TIMEOUT", "TIME_LIMIT_EXCEEDED",
                        "Execution exceeded the 3-second limit.", challenge, elapsed,
                        _read_capped(stdout_path), _read_capped(stderr_path),
                    )

            elapsed = time.monotonic() - start
            stdout = _read_capped(stdout_path)
            stderr = _read_capped(stderr_path)
            if stdout_path.stat().st_size >= MAX_OUTPUT_BYTES or stderr_path.stat().st_size >= MAX_OUTPUT_BYTES:
                return _failure("OUTPUT_LIMIT", "OUTPUT_LIMIT_EXCEEDED", "Output exceeded 64 KB.", challenge, elapsed, stdout, stderr)
            if not verdict_path.is_file():
                if process.returncode == -signal.SIGXFSZ:
                    return _failure("OUTPUT_LIMIT", "OUTPUT_LIMIT_EXCEEDED", "Output exceeded 64 KB.", challenge, elapsed, stdout, stderr)
                return _failure("RUNTIME_ERROR", "PROCESS_EXIT", "Python process exited before verification.", challenge, elapsed, stdout, stderr)

            with open(verdict_path, "rb") as verdict_file:
                raw = verdict_file.read(128 * 1024)
            result = json.loads(raw)
            if process.returncode != 0 or not _valid_verdict(result, challenge):
                return _failure("SANDBOX_ERROR", "INVALID_VERDICT", "Verifier did not return a valid result.", challenge, elapsed, stdout, stderr)
            result = {
                "status": result["status"],
                "passed": result["passed"],
                "verdict_label": STATUS_LABELS.get(result["status"], result["status"].replace("_", " ")),
                "sandbox_mode": get_sandbox_mode(),
                "error_type": result.get("error_type"),
                "error_summary": result.get("error_summary"),
                "testsPassed": result["testsPassed"],
                "totalTests": result["totalTests"],
                "publicTests": {
                    "passed": result["publicTests"]["passed"],
                    "total": result["publicTests"]["total"],
                    "results": [
                        {key: item[key] for key in ("name", "passed", "expected", "received", "error") if key in item}
                        for item in result["publicTests"]["results"]
                    ],
                },
                "hiddenTests": {
                    "passed": result["hiddenTests"]["passed"],
                    "total": result["hiddenTests"]["total"],
                    "results": [
                        {"name": item["name"], "passed": item["passed"]}
                        for item in result["hiddenTests"]["results"]
                    ],
                },
                "executionTime": round(elapsed, 3),
                "time": f"{elapsed:.3f}",
                "memory": "0",
                "stdout": stdout,
                "stderr": stderr or (result.get("error_summary") or ""),
            }
            return result
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return _failure("SANDBOX_ERROR", "RUNNER_FAILURE", f"Verifier unavailable: {type(exc).__name__}", challenge, time.monotonic() - start)


def execute_workspace_python(source_code):
    """Keep the legacy scratch-workspace contract without Flask-process exec().

    This path has no mission tests and is never used to clear Flight 101.
    """
    if not isinstance(source_code, str) or len(source_code.encode("utf-8")) > MAX_SOURCE_BYTES:
        return {"status": "Runtime Error", "stdout": "", "stderr": "Source exceeds 64 KB", "time": "0", "memory": "0"}
    start = time.monotonic()
    wrapper = (
        "import resource, runpy\n"
        "resource.setrlimit(resource.RLIMIT_CPU, (3, 4))\n"
        "resource.setrlimit(resource.RLIMIT_FSIZE, (65536, 65536))\n"
        "resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))\n"
        "runpy.run_path('submission.py', run_name='__main__')\n"
    )
    try:
        with tempfile.TemporaryDirectory(prefix="runtime-workspace-") as working_dir:
            work = Path(working_dir)
            (work / "submission.py").write_text(source_code, encoding="utf-8")
            stdout_path, stderr_path = work / "stdout.log", work / "stderr.log"
            command = [str(Path(sys.executable).resolve()), "-I", "-S", "-B", "-c", wrapper]
            with open(stdout_path, "wb") as stdout_file, open(stderr_path, "wb") as stderr_file:
                process = subprocess.Popen(
                    _confine_command(work, command), cwd=working_dir,
                    env={"PATH": "/usr/bin:/bin", "PYTHONHASHSEED": "0", "LANG": "C.UTF-8"},
                    stdin=subprocess.DEVNULL, stdout=stdout_file, stderr=stderr_file,
                    start_new_session=True, close_fds=True,
                )
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    process.wait()
                    return {"status": "Time Limit Exceeded", "stdout": _read_capped(stdout_path),
                            "stderr": "Execution exceeded the 3-second limit.", "time": "3", "memory": "0"}
            elapsed = f"{time.monotonic() - start:.3f}"
            stdout, stderr = _read_capped(stdout_path), _read_capped(stderr_path)
            if stdout_path.stat().st_size >= MAX_OUTPUT_BYTES or stderr_path.stat().st_size >= MAX_OUTPUT_BYTES:
                return {"status": "Runtime Error", "stdout": stdout,
                        "stderr": "Output exceeded 64 KB.", "time": elapsed, "memory": "0"}
            return {"status": "Accepted" if process.returncode == 0 else "Runtime Error",
                    "stdout": stdout, "stderr": stderr, "time": elapsed, "memory": "0"}
    except OSError as exc:
        return {"status": "Error", "stdout": "", "stderr": f"Workspace runner unavailable: {type(exc).__name__}",
                "time": "0", "memory": "0"}
