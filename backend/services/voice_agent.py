"""Optional Agora Conversational AI session wrapper.

Seamlessly bridges the published Agora Voice Agent with RunTime Arena's
AI Game Director. In text-mode or if credentials fail, graceful fallback
is guaranteed so missions can never be blocked.
"""

import logging
import random
import threading
import time
import requests

from config import Config
from services.director import build_director_prompt

logger = logging.getLogger("runtime-arena")
_sessions = {}
_sessions_lock = threading.Lock()


def _format_context_prompt(context=None, mission=None, hint_level=0):
    """Format full runtime telemetry into an in-world system prompt for the Agent."""
    ctx = context or {}
    player_name = ctx.get("player", {}).get("name") or "Pilot"
    m_info = ctx.get("mission") or mission or {}
    perf = ctx.get("performance") or {}
    exec_info = ctx.get("execution") or {}

    module_id = m_info.get("moduleId") or "flight-101"
    mission_title = m_info.get("title") or "Flight Mission"
    concept = m_info.get("concept") or m_info.get("topic") or "Algorithmic Stabilization"
    difficulty = m_info.get("difficulty") or "Normal"
    objective = m_info.get("objective") or "Restore system functionality."

    attempts = perf.get("attempts", 0)
    hints_used = perf.get("hintsUsed", hint_level)
    verdict = exec_info.get("verdict") or "Not yet executed"
    error_summary = exec_info.get("errorSummary") or "None"

    return (
        f"[RUNTIME ARENA TELEMETRY & FLIGHT CONTEXT]\n"
        f"Call-sign: Pilot {player_name}\n"
        f"Active Module: {module_id} | Mission: {mission_title}\n"
        f"Objective: {objective}\n"
        f"Core Concept: {concept} (Difficulty: {difficulty})\n"
        f"Flight Telemetry:\n"
        f"- Mission Attempts: {attempts}\n"
        f"- Hint Level Requested: {hints_used} of 3\n"
        f"- Latest Code Verification: {verdict}\n"
        f"- Safe Error Summary: {error_summary}\n\n"
        f"Directives:\n"
        f"1. You are the RunTime Arena AI Game Director. Address the player as 'Pilot {player_name}' or 'Pilot'.\n"
        f"2. Calibrate hint guidance strictly to Hint Level {hints_used}: Level 1 = conceptual vector, Level 2 = algorithmic logic, Level 3 = near-solution approach.\n"
        f"3. Never recite raw code or full solutions directly.\n"
        f"4. Keep responses punchy, immersive, and tactical."
    )


def _load_sdk():
    from agora_agent import (
        Agent,
        Agora,
        Area,
        DeepgramSTT,
        Gemini,
        MiniMaxTTS,
        OpenAI,
        expires_in_hours,
        generate_convo_ai_token,
    )

    return {
        "Agent": Agent,
        "Agora": Agora,
        "Area": Area,
        "DeepgramSTT": DeepgramSTT,
        "Gemini": Gemini,
        "MiniMaxTTS": MiniMaxTTS,
        "OpenAI": OpenAI,
        "expires_in_hours": expires_in_hours,
        "generate_convo_ai_token": generate_convo_ai_token,
    }


def voice_capability():
    """Return a client join configuration or a text-only fallback response."""
    if not Config.AGORA_APP_ID:
        return {
            "available": False,
            "reason": "VOICE_CONFIG_MISSING",
            "message": "AGORA_APP_ID is not configured in backend/.env",
            "fallback": "text",
        }

    # Dynamic token generation if certificate is configured (Production/Hackathon standard)
    if Config.AGORA_APP_CERTIFICATE:
        try:
            sdk = _load_sdk()
            channel = Config.AGORA_CHANNEL or "embed_b23dba98e2f8"
            user_uid = 47056828
            token = sdk["generate_convo_ai_token"](
                app_id=Config.AGORA_APP_ID,
                app_certificate=Config.AGORA_APP_CERTIFICATE,
                channel_name=channel,
                uid=user_uid,
                token_expire=86400,
            )
            return {
                "available": True,
                "app_id": Config.AGORA_APP_ID,
                "channel": channel,
                "uid": user_uid,
                "token": token,
                "agent_uid": Config.AGORA_AGENT_UID or "1001",
                "pipeline_id": Config.AGORA_PIPELINE_ID or "c4e07c0aa363409bb413a7ced0c0da08",
            }
        except Exception as exc:
            logger.warning("Agora dynamic token generation failed: %s", exc)
            return {
                "available": False,
                "reason": "TOKEN_GEN_ERROR",
                "message": f"Token generation failed: {exc}",
                "fallback": "text",
            }

    # Fallback to static AGORA_TOKEN if provided
    if Config.AGORA_TOKEN:
        channel = Config.AGORA_CHANNEL or "embed_b23dba98e2f8"
        return {
            "available": True,
            "app_id": Config.AGORA_APP_ID,
            "channel": channel,
            "uid": 47056828,
            "token": Config.AGORA_TOKEN,
            "agent_uid": Config.AGORA_AGENT_UID or "1001",
            "pipeline_id": Config.AGORA_PIPELINE_ID or "c4e07c0aa363409bb413a7ced0c0da08",
        }

    return {
        "available": False,
        "reason": "VOICE_CONFIG_MISSING",
        "message": "AGORA_APP_CERTIFICATE or AGORA_TOKEN is required in backend/.env",
        "fallback": "text",
    }


def _get_auth_token(channel="embed_b23dba98e2f8", uid=0):
    """Generate a dynamic token using App Certificate, or fall back to static token."""
    if Config.AGORA_APP_CERTIFICATE:
        sdk = _load_sdk()
        return sdk["generate_convo_ai_token"](
            app_id=Config.AGORA_APP_ID,
            app_certificate=Config.AGORA_APP_CERTIFICATE,
            channel_name=channel,
            uid=uid,
            token_expire=86400,
        )
    return Config.AGORA_TOKEN


def start_voice_session(channel=None, user_uid=None, mission=None, hint_level=0, context=None):
    """Connect the published Agora Voice Agent to the active mission channel."""
    # Preferred: Published Agora Conversational AI Agent REST API
    if Config.AGORA_PIPELINE_ID and (Config.AGORA_APP_CERTIFICATE or Config.AGORA_TOKEN):
        target_channel = channel or Config.AGORA_CHANNEL or "embed_b23dba98e2f8"
        agent_uid_int = int(Config.AGORA_AGENT_UID or "1001")
        prompt = _format_context_prompt(context, mission, hint_level)

        auth_token = _get_auth_token(target_channel, 0)
        agent_token = _get_auth_token(target_channel, agent_uid_int)

        url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{Config.AGORA_APP_ID}/join"
        headers = {
            "Authorization": f"agora token={auth_token}",
            "Content-Type": "application/json",
        }
        data = {
            "name": f"runtime-arena-{int(time.time())}",
            "pipeline_id": Config.AGORA_PIPELINE_ID,
            "properties": {
                "agent_rtc_uid": str(agent_uid_int),
                "channel": target_channel,
                "enable_string_uid": False,
                "idle_timeout": 120,
                "remote_rtc_uids": ["*"],
                "token": agent_token,
                "llm": {
                    "system_messages": [
                        {"role": "system", "content": prompt}
                    ]
                }
            }
        }

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=8.0)
            if resp.status_code in (200, 201):
                agent_id = resp.json().get("agent_id")
                with _sessions_lock:
                    _sessions[agent_id] = {
                        "type": "rest",
                        "channel": target_channel,
                        "start_time": time.time(),
                        "context": context or {},
                    }
                logger.info("Published Agora Voice Agent started: %s on channel %s", agent_id, target_channel)
                return {"available": True, "agent_id": agent_id}
            else:
                logger.warning("Agora agent join failed: %s %s", resp.status_code, resp.text)
                return {
                    "available": False,
                    "reason": "AGENT_START_FAILED",
                    "message": f"Agora API responded with status {resp.status_code}",
                    "fallback": "text",
                }
        except Exception as exc:
            logger.warning("Agora agent start request failed: %s", exc)
            return {
                "available": False,
                "reason": "AGENT_START_FAILED",
                "message": str(exc),
                "fallback": "text",
            }

    # Fallback: Local agora_agent SDK builder
    if Config.AGORA_APP_ID and Config.AGORA_APP_CERTIFICATE:
        try:
            sdk = _load_sdk()
            target_channel = channel or f"runtime-arena-{int(time.time())}"
            area = getattr(sdk["Area"], Config.AGORA_AREA, sdk["Area"].AP)
            client_kwargs = {
                "area": area,
                "app_id": Config.AGORA_APP_ID,
                "app_certificate": Config.AGORA_APP_CERTIFICATE,
                "timeout": 8.0,
            }
            client = sdk["Agora"](**client_kwargs)
            prompt = _format_context_prompt(context, mission, hint_level)

            agent = sdk["Agent"](
                client=client,
                instructions=prompt,
                greeting="Voice link ready. Ask for a mission hint when you need one.",
                failure_message="Voice link interrupted. Use the text hint control.",
                max_history=12,
                turn_detection={"language": "en-US"},
                advanced_features={"enable_rtm": True},
                parameters={"data_channel": "rtm", "enable_error_message": True},
            ).with_stt(
                sdk["DeepgramSTT"](model="nova-3", language="en")
            )

            if Config.GEMINI_API_KEY:
                agent = agent.with_llm(
                    sdk["Gemini"](
                        api_key=Config.GEMINI_API_KEY,
                        model=Config.GEMINI_MODEL,
                        system_messages=[{"role": "system", "content": prompt}],
                        greeting_message="Voice link ready. Ask for a mission hint.",
                        failure_message="Use the text hint control.",
                        max_history=12,
                    )
                )
            else:
                agent = agent.with_llm(
                    sdk["OpenAI"](
                        api_key=Config.GROQ_API_KEY,
                        base_url="https://api.groq.com/openai/v1/chat/completions",
                        model=Config.GROQ_MODEL,
                        system_messages=[{"role": "system", "content": prompt}],
                        greeting_message="Voice link ready. Ask for a mission hint.",
                        failure_message="Use the text hint control.",
                        max_history=12,
                        params={"temperature": 0.35, "max_tokens": 160},
                    )
                )

            agent = agent.with_tts(
                sdk["MiniMaxTTS"](
                    model="speech_2_6_turbo",
                    voice_id="English_captivating_female1",
                )
            )
            session = agent.create_session(
                channel=target_channel,
                agent_uid=Config.AGORA_AGENT_UID,
                remote_uids=[str(user_uid or "0")],
                name=f"runtime-arena-director-{int(time.time())}",
                idle_timeout=90,
                expires_in=sdk["expires_in_hours"](1),
                debug=False,
            )
            agent_id = session.start()
            with _sessions_lock:
                _sessions[agent_id] = {
                    "type": "sdk",
                    "sdk_session": session,
                    "channel": target_channel,
                }
            return {"available": True, "agent_id": agent_id}
        except Exception as exc:
            logger.warning("Agora SDK voice start failed: %s", exc)
            return {
                "available": False,
                "reason": "AGENT_START_FAILED",
                "message": str(exc),
                "fallback": "text",
            }

    return {
        "available": False,
        "reason": "VOICE_CONFIG_MISSING",
        "message": "Neither AGORA_TOKEN nor AGORA_APP_CERTIFICATE is configured",
        "fallback": "text",
    }


def update_voice_context(agent_id, context):
    """Update running conversational agent telemetry."""
    if not agent_id or (not Config.AGORA_APP_CERTIFICATE and not Config.AGORA_TOKEN):
        return False
    try:
        with _sessions_lock:
            session_info = _sessions.get(agent_id, {})
        channel = session_info.get("channel") or Config.AGORA_CHANNEL or "embed_b23dba98e2f8"

        prompt = _format_context_prompt(context)
        auth_token = _get_auth_token(channel, 0)
        agent_token = _get_auth_token(channel, int(Config.AGORA_AGENT_UID or "1001"))

        update_url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{Config.AGORA_APP_ID}/agents/{agent_id}/update"
        headers = {
            "Authorization": f"agora token={auth_token}",
            "Content-Type": "application/json",
        }
        update_data = {
            "properties": {
                "token": agent_token,
                "llm": {
                    "system_messages": [
                        {"role": "system", "content": prompt}
                    ]
                }
            }
        }
        resp = requests.post(update_url, json=update_data, headers=headers, timeout=5.0)
        with _sessions_lock:
            if agent_id in _sessions:
                _sessions[agent_id]["context"] = context
        return resp.status_code == 200
    except Exception as exc:
        logger.warning("Voice context update failed (non-blocking): %s", exc)
        return False


def speak_voice_agent(agent_id, text):
    """Broadcast an urgent TTS line from the Director over the active channel."""
    if not agent_id or (not Config.AGORA_APP_CERTIFICATE and not Config.AGORA_TOKEN) or not text:
        return False
    try:
        with _sessions_lock:
            session_info = _sessions.get(agent_id, {})
        channel = session_info.get("channel") or Config.AGORA_CHANNEL or "embed_b23dba98e2f8"
        auth_token = _get_auth_token(channel, 0)

        speak_url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{Config.AGORA_APP_ID}/agents/{agent_id}/speak"
        headers = {
            "Authorization": f"agora token={auth_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text[:512],
            "priority": "INTERRUPT",
            "interruptable": True,
        }
        resp = requests.post(speak_url, json=payload, headers=headers, timeout=5.0)
        return resp.status_code == 200
    except Exception as exc:
        logger.warning("Voice speak broadcast failed: %s", exc)
        return False


def stop_voice_session(agent_id):
    """Best-effort cleanup; stopping voice is never mission-critical."""
    with _sessions_lock:
        session_info = _sessions.pop(agent_id, None)

    channel = (session_info.get("channel") if isinstance(session_info, dict) else None) or Config.AGORA_CHANNEL or "embed_b23dba98e2f8"

    if (Config.AGORA_APP_CERTIFICATE or Config.AGORA_TOKEN) and agent_id:
        try:
            auth_token = _get_auth_token(channel, 0)
            leave_url = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{Config.AGORA_APP_ID}/agents/{agent_id}/leave"
            headers = {
                "Authorization": f"agora token={auth_token}",
                "Content-Type": "application/json",
            }
            requests.post(leave_url, headers=headers, timeout=5.0)
        except Exception as exc:
            logger.warning("Voice session leave request failed: %s", exc)

    if isinstance(session_info, dict) and "sdk_session" in session_info:
        try:
            session_info["sdk_session"].stop()
        except Exception as exc:
            logger.warning("Agora SDK session cleanup failed: %s", exc)
