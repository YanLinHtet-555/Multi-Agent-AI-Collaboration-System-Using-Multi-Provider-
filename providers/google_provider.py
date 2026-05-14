import os
from typing import Dict, List, Optional

from openai import OpenAI
from openai import BadRequestError as OpenAIBadRequestError
from openai import RateLimitError as OpenAIRateLimitError

from .base_provider import (
    BaseProvider, ChatResponse, Choice, Message,
    ToolCall, ToolFunction, ProviderBadRequestError, ProviderRateLimitError,
)

# Uses Google's OpenAI-compatible endpoint — no extra SDK required
_GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


class GoogleProvider(BaseProvider):
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("GOOGLE_API_KEY"),
            base_url=_GOOGLE_BASE_URL,
        )

    @property
    def name(self) -> str:
        return "google"

    @property
    def default_model(self) -> str:
        return "gemini-1.5-flash"

    @property
    def manager_model(self) -> str:
        return "gemini-1.5-pro"

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
