import os
from pathlib import Path
from typing import Optional

from dotenv import set_key, find_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_ENV_FILE = find_dotenv() or ".env"

# Maps friendly name → env variable
_KEY_MAP = {
    "groq":                 "GROQ_API_KEY",
    "openai":               "OPENAI_API_KEY",
    "anthropic":            "ANTHROPIC_API_KEY",
    "google":               "GOOGLE_API_KEY",
    "ollama_url":           "OLLAMA_BASE_URL",
    "ollama_model":         "OLLAMA_MODEL",
    "ollama_manager_model": "OLLAMA_MANAGER_MODEL",
}


@router.get("/settings")
def get_settings():
    """Return which keys are configured — never exposes actual values."""
    return {
        field: bool(os.getenv(env_var))
        for field, env_var in _KEY_MAP.items()
    }


class SettingsBody(BaseModel):
    groq:                 Optional[str] = None
    openai:               Optional[str] = None
    anthropic:            Optional[str] = None
    google:               Optional[str] = None
    ollama_url:           Optional[str] = None
    ollama_model:         Optional[str] = None
    ollama_manager_model: Optional[str] = None


@router.post("/settings")
def save_settings(body: SettingsBody):
    """Write non-empty values to .env and update the running process."""
    updates = {
        _KEY_MAP[field]: getattr(body, field)
        for field in _KEY_MAP
        if getattr(body, field) is not None and getattr(body, field).strip()
    }

    env_path = str(Path(_ENV_FILE).resolve())
    for env_var, value in updates.items():
        set_key(env_path, env_var, value.strip())
        os.environ[env_var] = value.strip()

    return {"saved": list(updates.keys())}
