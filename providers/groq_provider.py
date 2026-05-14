import os
from typing import Dict, List, Optional

from groq import Groq
from groq import BadRequestError as GroqBadRequestError
from groq import RateLimitError as GroqRateLimitError

from .base_provider import (
    BaseProvider, ChatResponse, Choice, Message,
    ToolCall, ToolFunction, ProviderBadRequestError, ProviderRateLimitError,
)


class GroqProvider(BaseProvider):
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    @property
    def name(self) -> str:
        return "groq"

    @property
    def default_model(self) -> str:
        return "llama-3.1-8b-instant"

    @property
    def manager_model(self) -> str:
        return "llama-3.3-70b-versatile"

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

        except GroqRateLimitError as e:
            raise ProviderRateLimitError(str(e)) from e
        except GroqBadRequestError as e:
            body = getattr(e, "body", {}) or {}
            raise ProviderBadRequestError(str(e), body=body) from e
