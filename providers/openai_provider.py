import os
from typing import Dict, List, Optional

from openai import OpenAI
from openai import BadRequestError as OpenAIBadRequestError
from openai import RateLimitError as OpenAIRateLimitError

from .base_provider import (
    BaseProvider, ChatResponse, Choice, Message,
    ToolCall, ToolFunction, ProviderBadRequestError, ProviderRateLimitError,
)


class OpenAIProvider(BaseProvider):
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    @property
    def default_model(self) -> str:
        return "gpt-4o-mini"

    @property
    def manager_model(self) -> str:
        return "gpt-4o"

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
