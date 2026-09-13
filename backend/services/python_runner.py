"""Child-process runner for the isolated hackathon execution sandbox.

This file is copied into a temporary directory and launched with ``python -I -S``.
It does not import the Flask app or inherit application secrets.
"""

import builtins
import json
import os
import resource
import sys


class OutputLimitExceeded(BaseException):
    pass


class BoundedWriter:
    def __init__(self, stream, limit=65536):
        self.stream = stream
        self.limit = limit
        self.count = 0

    def write(self, text):
        encoded = str(text).encode("utf-8", errors="replace")
        remaining = self.limit - self.count
        if remaining <= 0:
            raise OutputLimitExceeded()
        payload = encoded[:remaining]
        self.stream.write(payload.decode("utf-8", errors="ignore"))
        self.stream.flush()
        self.count += len(payload)
        if len(encoded) > remaining:
            raise OutputLimitExceeded()
        return len(text)

    def flush(self):
        self.stream.flush()


class NullWriter:
    """Discard hidden-test output without exposing hidden inputs in the API."""

    def write(self, text):
        return len(text)

    def flush(self):
        pass


SAFE_MODULES = {"collections", "math", "heapq", "itertools", "functools", "bisect"}


def limited_import(name, globals=None, locals=None, fromlist=(), level=0):
    if name.split(".", 1)[0] not in SAFE_MODULES:
        raise ImportError(f"Import of '{name}' is unavailable in this coding sandbox")
    return builtins.__import__(name, globals, locals, fromlist, level)


def safe_builtins():
    names = (
        "abs", "all", "any", "bool", "callable", "chr", "dict", "divmod", "enumerate",
        "filter", "float", "frozenset", "getattr", "hasattr", "hash", "int", "isinstance",
        "issubclass", "iter", "len", "list", "map", "max", "min", "next", "object",
        "ord", "pow", "print", "range", "repr", "reversed", "round", "set", "setattr",
        "slice", "sorted", "str", "sum", "super", "tuple", "type", "zip",
        "Exception", "AssertionError", "AttributeError", "IndexError", "KeyError",
        "NameError", "RuntimeError", "StopIteration", "TypeError", "ValueError",
        "ZeroDivisionError", "NotImplementedError", "True", "False", "None",
        "__build_class__", "property", "staticmethod", "classmethod",
    )
    allowed = {name: getattr(builtins, name) for name in names}
    allowed["__import__"] = limited_import
    return allowed


class InvalidReturnError(TypeError):
    pass


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return f"ListNode({self.val})"


def serialize_linked_list(node, limit):
    if node is None:
        return []
    if not (hasattr(node, "val") and hasattr(node, "next")):
        raise InvalidReturnError(f"Expected ListNode or None, received {type(node).__name__}")
    values = []
    seen = set()
    while node is not None:
        if not hasattr(node, "val") or not hasattr(node, "next"):
            raise InvalidReturnError("Malformed linked-list node (missing val or next attribute)")
        if id(node) in seen:
            raise InvalidReturnError("Cycle detected in linked-list output")
        seen.add(id(node))
        values.append(node.val)
        if len(values) > limit:
            raise InvalidReturnError("Linked-list output exceeds expected length")
        node = node.next
    return values


def run_case(mission_id, function, namespace, case, hidden):
    if mission_id == "01":
        node_class = namespace.get("ListNode")
        if not isinstance(node_class, type):
            node_class = ListNode
        head = None
        for value in reversed(case["values"]):
            try:
                head = node_class(value, head)
            except TypeError:
                node = node_class(value)
                node.next = head
                head = node
        raw = function(head)
        actual = serialize_linked_list(raw, len(case["values"]))
        expected = list(reversed(case["values"]))
    elif mission_id == "02":
        actual = function(case["graph"], case["start"], case["target"])
        if not isinstance(actual, int) or isinstance(actual, bool):
            raise InvalidReturnError(f"Expected int, received {type(actual).__name__}")
        expected = case["expected"]
    else:
        actual = function(case["costs"])
        if not isinstance(actual, int) or isinstance(actual, bool):
            raise InvalidReturnError(f"Expected int, received {type(actual).__name__}")
        expected = case["expected"]

    passed = type(actual) is type(expected) and actual == expected
    result = {"passed": passed}
    if not hidden and not passed:
        result["expected"] = repr(expected)[:200]
        result["received"] = repr(actual)[:200]
    return result


def apply_limits():
    # The parent also enforces a wall-clock timeout and kills the process group.
    resource.setrlimit(resource.RLIMIT_CPU, (3, 4))
    resource.setrlimit(resource.RLIMIT_FSIZE, (65536, 65536))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    for name, value in (("RLIMIT_NPROC", 0), ("RLIMIT_CORE", 0)):
        limit = getattr(resource, name, None)
        if limit is not None:
            try:
                resource.setrlimit(limit, (value, value))
            except (OSError, ValueError):
                pass
    try:
        resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
    except (OSError, ValueError):
        pass


def main():
    apply_limits()
    sys.stdout = BoundedWriter(sys.stdout)
    sys.stderr = BoundedWriter(sys.stderr)
    verdict_path = sys.argv[1]
    with open("challenge.json", encoding="utf-8") as source:
        challenge = json.load(source)
    with open("submission.py", encoding="utf-8") as source:
        submission = source.read()

    public_cases = challenge["public_tests"]
    hidden_cases = challenge["hidden_tests"]
    public_results = []
    hidden_results = []
    status = "ACCEPTED"
    error_type = None
    error_summary = None

    try:
        compiled = compile(submission, "submission.py", "exec")
        # Injected ListNode ensures players only need to implement reverse_fuel_line
        namespace = {
            "__builtins__": safe_builtins(),
            "__name__": "submission",
            "ListNode": ListNode,
        }
        # Player code runs only in this disposable child process.
        exec(compiled, namespace, namespace)
        function = namespace.get(challenge["entry_function"])
        if not callable(function):
            raise NameError(f"Required function '{challenge['entry_function']}' was not defined")

        for index, case in enumerate(public_cases, 1):
            try:
                result = run_case(challenge["mission_id"], function, namespace, case, False)
            except OutputLimitExceeded:
                raise
            except InvalidReturnError as exc:
                result = {"passed": False, "error": f"INVALID_RETURN: {str(exc)[:180]}"}
                if error_type is None:
                    status = "INVALID_RETURN"
                    error_type = "INVALID_RETURN"
                    error_summary = f"Invalid return structure: {str(exc)[:180]}"
            except BaseException as exc:
                result = {"passed": False, "error": f"{type(exc).__name__}: {str(exc)[:180]}"}
            result["name"] = f"Public Test {index}"
            public_results.append(result)

        visible_stdout, visible_stderr = sys.stdout, sys.stderr
        sys.stdout = sys.stderr = NullWriter()
        try:
            for index, case in enumerate(hidden_cases, 1):
                try:
                    result = run_case(challenge["mission_id"], function, namespace, case, True)
                except OutputLimitExceeded:
                    raise
                except InvalidReturnError as exc:
                    result = {"passed": False}
                    if error_type is None:
                        status = "INVALID_RETURN"
                        error_type = "INVALID_RETURN"
                        error_summary = f"Invalid return structure: {str(exc)[:180]}"
                except BaseException:
                    result = {"passed": False}
                hidden_results.append({"name": f"Hidden Test {index}", "passed": result["passed"]})
        finally:
            sys.stdout, sys.stderr = visible_stdout, visible_stderr

        if not all(result["passed"] for result in public_results + hidden_results):
            if status == "ACCEPTED":
                status = "FAILED_TESTS"
    except SyntaxError as exc:
        status = "SYNTAX_ERROR"
        error_type = "SYNTAX_ERROR"
        error_summary = f"Line {exc.lineno}: {exc.msg}"
    except OutputLimitExceeded:
        status = "OUTPUT_LIMIT"
        error_type = "OUTPUT_LIMIT_EXCEEDED"
        error_summary = "Output exceeded 64 KB. Reduce print volume and retry."
    except BaseException as exc:
        status = "RUNTIME_ERROR"
        error_type = type(exc).__name__
        error_summary = f"{type(exc).__name__}: {str(exc)[:180]}"

    result = {
        "status": status,
        "passed": status == "ACCEPTED",
        "error_type": error_type,
        "error_summary": error_summary,
        "publicTests": {
            "passed": sum(item["passed"] for item in public_results),
            "total": len(public_cases),
            "results": public_results,
        },
        "hiddenTests": {
            "passed": sum(item["passed"] for item in hidden_results),
            "total": len(hidden_cases),
            "results": hidden_results,
        },
    }
    result["testsPassed"] = result["publicTests"]["passed"] + result["hiddenTests"]["passed"]
    result["totalTests"] = len(public_cases) + len(hidden_cases)
    with open(verdict_path, "w", encoding="utf-8") as verdict_file:
        json.dump(result, verdict_file)


if __name__ == "__main__":
    main()
