"""
═══════════════════════════════════════════
TeamFit AI — Configuration
Environment-based settings for dev & production.
═══════════════════════════════════════════
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded deterministically regardless of CWD
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env")
load_dotenv()


class Config:
    # ── Security ──
    SECRET_KEY = os.environ.get("SECRET_KEY", "teamfit-hackathon-secret-key-2026-secure")

    # ── Database ──
    # Use DATABASE_URL for PostgreSQL (Render/Railway), fallback to SQLite
    DATABASE_URL = os.environ.get("DATABASE_URL", "")

    # ── AI ──
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")

    # ── Optional Agora voice layer ──
    AGORA_APP_ID = os.environ.get("AGORA_APP_ID", "")
    AGORA_APP_CERTIFICATE = os.environ.get("AGORA_APP_CERTIFICATE", "")
    AGORA_CUSTOMER_ID = os.environ.get("AGORA_CUSTOMER_ID", "")
    AGORA_CUSTOMER_SECRET = os.environ.get("AGORA_CUSTOMER_SECRET", "")
    AGORA_AREA = os.environ.get("AGORA_AREA", "AP").upper()
    AGORA_AGENT_UID = os.environ.get("AGORA_AGENT_UID", "123456")

    # ── Code Execution ──
    JUDGE0_API_KEY = os.environ.get("JUDGE0_API_KEY", "")
    JUDGE0_URL = os.environ.get("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
    JUDGE0_HOST = os.environ.get("JUDGE0_HOST", "judge0-ce.p.rapidapi.com")

    # ── Server ──
    FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    PORT = int(os.environ.get("FLASK_PORT", os.environ.get("PORT", 5001)))

    # ── CORS ──
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    ).split(",")
