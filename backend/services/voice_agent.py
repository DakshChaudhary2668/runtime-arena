"""Optional Agora Conversational AI session wrapper.

All SDK imports and network calls are isolated here so a missing package,
credentials, or network connection can never interrupt the core mission loop.
"""

import logging
import random
import threading
import time

from config import Config
from services.director import build_director_prompt

logger = logging.getLogger("runtime-arena")
_sessions = {}
_sessions_lock = threading.Lock()


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
    if not Config.AGORA_APP_ID or not Config.AGORA_APP_CERTIFICATE:
        logger.info("Agora voice unavailable: AGORA_APP_ID or AGORA_APP_CERTIFICATE not configured in backend/.env")
        return {
            "available": False,
            "reason": "VOICE_CONFIG_MISSING",
            "message": "AGORA_APP_ID and AGORA_APP_CERTIFICATE are not set in backend/.env",
            "fallback": "text",
        }

    # Agora cloud cannot reach a laptop-local Ollama server. A configured cloud
    # provider keeps voice and text on the same director prompt/brain.
    if not Config.GROQ_API_KEY and not Config.GEMINI_API_KEY:
        logger.info("Agora voice disabled: configure GROQ_API_KEY or GEMINI_API_KEY")
        return {
            "available": False,
            "reason": "LLM_CONFIG_MISSING",
            "message": "GROQ_API_KEY or GEMINI_API_KEY required for Agora Conversational AI cloud pipeline",
            "fallback": "text",
        }

    try:
        sdk = _load_sdk()
    except Exception as exc:
        logger.warning("Agora SDK import failed: %s", exc)
        return {
            "available": False,
            "reason": "SDK_IMPORT_ERROR",
            "message": f"agora-agents SDK failed to import: {exc}",
            "fallback": "text",
        }

    try:
        channel = f"runtime-arena-{int(time.time())}-{random.randint(1000, 9999)}"
        user_uid = str(random.randint(1000, 9_999_000))
        token = sdk["generate_convo_ai_token"](
            app_id=Config.AGORA_APP_ID,
            app_certificate=Config.AGORA_APP_CERTIFICATE,
            channel_name=channel,
            uid=int(user_uid),
            token_expire=3600,
        )
        return {
            "available": True,
            "app_id": Config.AGORA_APP_ID,
            "channel": channel,
            "uid": user_uid,
            "token": token,
            "agent_uid": Config.AGORA_AGENT_UID,
        }
    except Exception as exc:
        logger.warning("Agora voice capability token generation failed: %s", exc)
        return {
            "available": False,
            "reason": "TOKEN_GEN_ERROR",
            "message": f"Token generation failed: {exc}",
            "fallback": "text",
        }


def start_voice_session(channel, user_uid, mission=None, hint_level=0):
    """Start ASR → shared director prompt → TTS and return the agent id."""
    try:
        sdk = _load_sdk()
        area = getattr(sdk["Area"], Config.AGORA_AREA, sdk["Area"].AP)
        client_kwargs = {
            "area": area,
            "app_id": Config.AGORA_APP_ID,
            "app_certificate": Config.AGORA_APP_CERTIFICATE,
            "timeout": 8.0,
        }
        if Config.AGORA_CUSTOMER_ID and Config.AGORA_CUSTOMER_SECRET:
            client_kwargs["customer_id"] = Config.AGORA_CUSTOMER_ID
            client_kwargs["customer_secret"] = Config.AGORA_CUSTOMER_SECRET

        client = sdk["Agora"](**client_kwargs)

        prompt = build_director_prompt(mission, "", hint_level)
        agent = sdk["Agent"](
            client=client,
            instructions=prompt,
            greeting="Voice link ready. Ask for a mission hint when you need one.",
            failure_message="Voice link interrupted. Use the text hint control.",
            max_history=12,
            turn_detection={"language": "en-US"},
            advanced_features={"enable_rtm": True},
            parameters={
                "data_channel": "rtm",
                "enable_error_message": True,
            },
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
            channel=channel,
            agent_uid=Config.AGORA_AGENT_UID,
            remote_uids=[str(user_uid)],
            name=f"runtime-arena-director-{int(time.time())}",
            idle_timeout=90,
            expires_in=sdk["expires_in_hours"](1),
            debug=False,
        )
        agent_id = session.start()
        with _sessions_lock:
            _sessions[agent_id] = session
        return {"available": True, "agent_id": agent_id}
    except Exception as exc:
        logger.warning("Agora voice session start failed; using text fallback: %s", exc)
        return {
            "available": False,
            "reason": "AGENT_START_FAILED",
            "message": str(exc),
            "fallback": "text",
        }


def stop_voice_session(agent_id):
    """Best-effort cleanup; stopping voice is never mission-critical."""
    with _sessions_lock:
        session = _sessions.pop(agent_id, None)
    if not session:
        return
    try:
        session.stop()
    except Exception as exc:
        logger.warning("Agora voice session cleanup failed: %s", exc)
