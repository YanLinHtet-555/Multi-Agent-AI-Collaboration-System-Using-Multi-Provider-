import os

from .base_provider import (
    BaseProvider,
    ChatResponse,
    Choice,
    Message,
    ToolCall,
    ToolFunction,
    ProviderRateLimitError,
    ProviderBadRequestError,
)

SUPPORTED_PROVIDERS = ("groq", "openai", "anthropic", "google")


def get_provider(name: str = None) -> BaseProvider:
    """Return a provider instance. Falls back to AI_PROVIDER env var, then 'groq'."""
    provider_name = (name or os.getenv("AI_PROVIDER", "groq")).lower()

    if provider_name == "groq":
        from .groq_provider import GroqProvider
        return GroqProvider()
    elif provider_name == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider()
    elif provider_name in ("anthropic", "claude"):
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider()
    elif provider_name in ("google", "gemini"):
        from .google_provider import GoogleProvider
        return GoogleProvider()
    else:
        raise ValueError(
            f"Unknown provider: {provider_name!r}. "
            f"Choose from: {', '.join(SUPPORTED_PROVIDERS)}"
        )


__all__ = [
    "get_provider",
    "BaseProvider",
    "ChatResponse",
    "Choice",
    "Message",
    "ToolCall",
    "ToolFunction",
    "ProviderRateLimitError",
    "ProviderBadRequestError",
    "SUPPORTED_PROVIDERS",
]
