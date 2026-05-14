import json
import os
from typing import Dict, List, Optional

import anthropic

from .base_provider import (
    BaseProvider, ChatResponse, Choice, Message,
    ToolCall, ToolFunction, ProviderBadRequestError, ProviderRateLimitError,
)


class AnthropicProvider(BaseProvider):
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    @property
    def name(self) -> str:
        return "anthropic"

    @property
    def default_model(self) -> str:
        return "claude-haiku-4-5-20251001"

    @property
    def manager_model(self) -> str:
        return "claude-sonnet-4-6"

    def _to_anthropic_messages(self, messages: List[Dict]):
        """Extract system prompt and convert OpenAI-format messages to Anthropic format."""
        system = ""
        converted: List[Dict] = []

        for msg in messages:
            role = msg["role"]

            if role == "system":
                system = msg["content"]
                continue

            if role == "user":
                converted.append({"role": "user", "content": msg["content"]})

            elif role == "assistant":
                parts: List[Dict] = []
                if msg.get("content"):
                    parts.append({"type": "text", "text": msg["content"]})
                for tc in (msg.get("tool_calls") or []):
                    parts.append({
                        "type": "tool_use",
                        "id": tc["id"],
                        "name": tc["function"]["name"],
                        "input": json.loads(tc["function"]["arguments"]),
                    })
                converted.append({
                    "role": "assistant",
                    "content": parts or [{"type": "text", "text": ""}],
                })

            elif role == "tool":
                tool_result = {
                    "type": "tool_result",
                    "tool_use_id": msg["tool_call_id"],
                    "content": msg["content"],
                }
                # Batch consecutive tool results into a single user message
                if converted and converted[-1]["role"] == "user" and isinstance(converted[-1]["content"], list):
                    converted[-1]["content"].append(tool_result)
                else:
                    converted.append({"role": "user", "content": [tool_result]})

        return system, converted

    def _to_anthropic_tools(self, tools: List[Dict]) -> List[Dict]:
        return [
            {
                "name": t["function"]["name"],
                "description": t["function"].get("description", ""),
                "input_schema": t["function"].get(
                    "parameters", {"type": "object", "properties": {}}
                ),
            }
            for t in tools
        ]

    def create_chat_completion(
        self,
        model: str,
        messages: List[Dict],
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None,
    ) -> ChatResponse:
        try:
            system, converted_messages = self._to_anthropic_messages(messages)
            kwargs: Dict = {}
            if system:
                kwargs["system"] = system
            if tools:
                kwargs["tools"] = self._to_anthropic_tools(tools)
                kwargs["tool_choice"] = {"type": "auto"}

            response = self.client.messages.create(
                model=model,
                max_tokens=4096,
                messages=converted_messages,
                **kwargs,
            )

            content_text = ""
            tool_calls: List[ToolCall] = []

            for block in response.content:
                if block.type == "text":
                    content_text = block.text
                elif block.type == "tool_use":
                    tool_calls.append(ToolCall(
                        id=block.id,
                        function=ToolFunction(
                            name=block.name,
                            arguments=json.dumps(block.input),
                        ),
                    ))

            if response.stop_reason == "tool_use":
                finish_reason = "tool_calls"
            else:
                finish_reason = "stop"

            return ChatResponse(choices=[Choice(
                message=Message(
                    content=content_text or None,
                    tool_calls=tool_calls or None,
                ),
                finish_reason=finish_reason,
            )])

        except anthropic.RateLimitError as e:
            raise ProviderRateLimitError(str(e)) from e
        except anthropic.BadRequestError as e:
            raise ProviderBadRequestError(str(e)) from e
