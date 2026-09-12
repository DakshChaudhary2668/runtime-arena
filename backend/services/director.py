"""Shared AI Game Director hint generation for text and voice surfaces."""

import logging

import requests

from config import Config

logger = logging.getLogger("runtime-arena")


def build_director_prompt(mission=None, code="", hint_level=0):
    """Build the single director persona shared by text and Agora voice."""
    mission = mission or {}
    title = mission.get("title", "active mission")
    topic = mission.get("topic", "the current coding task")
    objective = mission.get("objective", "Complete the active system repair.")
    trimmed_code = (code or "")[-3500:]
    return (
        "You are the RunTime Arena AI Game Director. Give one concise, actionable "
        "coding hint without revealing the complete solution. Keep spoken replies to "
        "one or two sentences and do not use markdown lists. "
        f"Mission: {title}. Topic: {topic}. Objective: {objective}. "
        f"Current hint level: {hint_level}.\nCurrent player code:\n{trimmed_code}"
    )


def generate_hint(question, mission=None, code="", hint_level=0, fallback=""):
    """Try the configured AI providers and always return a safe text fallback."""
    prompt = build_director_prompt(mission, code, hint_level)
    user_question = (question or "Give me the next useful hint.").strip()

    providers = (
        _ollama_hint,
        _gemini_hint if Config.GEMINI_API_KEY else None,
        _groq_hint if Config.GROQ_API_KEY else None,
    )
    for provider in providers:
        if provider is None:
            continue
        try:
            answer = provider(prompt, user_question)
            if answer:
                return answer.strip()
        except Exception as exc:  # Voice/text help must never block gameplay.
            logger.warning("AI Director provider %s unavailable: %s", provider.__name__, exc)

    return fallback or "Trace the state change one step at a time and verify the value you update before advancing."


def generate_performance_summary(analytics):
    """Use the same provider chain for a short, non-competitive player summary."""
    fallback = _fallback_performance_summary(analytics)
    if not analytics.get("completed_missions"):
        return fallback

    system_prompt = (
        "You are the RunTime Arena AI Game Director. Summarize one player's coding "
        "behavior in two concise sentences. Be constructive, specific, and never compare "
        "them to other players. Mention one strength and one useful next focus."
    )
    question = (
        f"Completed missions: {analytics.get('completed_missions')}; "
        f"attempts: {analytics.get('total_attempts')}; average hint level: "
        f"{analytics.get('average_hint_level')}; failed executions: "
        f"{analytics.get('failed_executions')}; mission trend: "
        f"{analytics.get('missions', [])}."
    )
    providers = (
        _ollama_hint,
        _gemini_hint if Config.GEMINI_API_KEY else None,
        _groq_hint if Config.GROQ_API_KEY else None,
    )
    for provider in providers:
        if provider is None:
            continue
        try:
            answer = provider(system_prompt, question)
            if answer:
                return answer.strip()
        except Exception as exc:
            logger.warning("AI analytics provider %s unavailable: %s", provider.__name__, exc)
    return fallback


def _fallback_performance_summary(analytics):
    completed = analytics.get("completed_missions", 0)
    if not completed:
        return "Complete your first mission to unlock an AI Director performance readout."
    average_attempts = analytics.get("total_attempts", 0) / completed
    hint_level = analytics.get("average_hint_level", 0)
    pace = "You are resolving missions with a direct execution pattern" if average_attempts <= 2 else "You are persistent across repeated verification cycles"
    focus = "keep explaining your state transitions before running code" if hint_level > 1 else "try the next mission with one fewer intervention"
    return f"{pace}. For the next run, {focus}."


def _ollama_hint(system_prompt, question):
    response = requests.post(
        f"{Config.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        json={
            "model": Config.OLLAMA_MODEL,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            "options": {"temperature": 0.35},
        },
        timeout=4,
    )
    response.raise_for_status()
    return response.json().get("message", {}).get("content", "")


def _gemini_hint(system_prompt, question):
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{Config.GEMINI_MODEL}:generateContent",
        params={"key": Config.GEMINI_API_KEY},
        json={
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": question}]}],
            "generationConfig": {"temperature": 0.35, "maxOutputTokens": 160},
        },
        timeout=6,
    )
    response.raise_for_status()
    candidates = response.json().get("candidates", [])
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return " ".join(part.get("text", "") for part in parts)


def _groq_hint(system_prompt, question):
    from groq import Groq

    client = Groq(api_key=Config.GROQ_API_KEY, timeout=6.0, max_retries=0)
    completion = client.chat.completions.create(
        model=Config.GROQ_MODEL,
        temperature=0.35,
        max_tokens=160,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
    )
    return completion.choices[0].message.content or ""
