import os
from typing import Dict, List, Optional

from openai import OpenAI
from openai import BadRequestError as OpenAIBadRequestError
from openai import RateLimitError as OpenAIRateLimitError

from .base_provider import (
    BaseProvider, ChatResponse, Choice, Message,
    ToolCall, ToolFunction, ProviderBadRequestError, ProviderRateLimitError,
)

_DEFAULT_BASE_URL = "http://localhost:11434/v1"
_DEFAULT_MODEL = "llama3.2"
_DEFAULT_MANAGER_MODEL = "llama3.1"


class OllamaProvider(BaseProvider):
    def __init__(self):
        self.client = OpenAI(
            # Ollama does not require a real key — any non-empty string works
            api_key=os.getenv("OLLAMA_API_KEY", "ollama"),
            base_url=os.getenv("OLLAMA_BASE_URL", _DEFAULT_BASE_URL),
        )

    @property
    def name(self) -> str:
        return "ollama"

    @property
    def default_model(self) -> str:
        return os.getenv("OLLAMA_MODEL", _DEFAULT_MODEL)

    @property
    def manager_model(self) -> str:
        return os.getenv("OLLAMA_MANAGER_MODEL", _DEFAULT_MANAGER_MODEL)

    def create_chat_completion(
        self,
        model: str,
        messages: List[Dict],
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None,
    ) -> ChatResponse:
        try:
            kwargs: Dict = {}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = tool_choice or "auto"

            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs,
            )

            choice = response.choices[0]
            msg = choice.message
            tool_calls = None
            if msg.tool_calls:
                tool_calls = [
                    ToolCall(
                        id=tc.id,
                        function=ToolFunction(
                            name=tc.function.name,
                            arguments=tc.function.arguments,
                        ),
                    )
                    for tc in msg.tool_calls
                ]

            return ChatResponse(choices=[Choice(
                message=Message(content=msg.content, tool_calls=tool_calls),
                finish_reason=choice.finish_reason,
            )])

        except OpenAIRateLimitError as e:
            raise ProviderRateLimitError(str(e)) from e
        except OpenAIBadRequestError as e:
            body = getattr(e, "body", {}) or {}
            raise ProviderBadRequestError(str(e), body=body) from e
