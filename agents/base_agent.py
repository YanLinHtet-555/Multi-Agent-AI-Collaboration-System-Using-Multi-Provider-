import json
from typing import Dict, List, Optional

from providers import get_provider
from providers.base_provider import BaseProvider


class BaseAgent:
    def __init__(
        self,
        name: str,
        role: str,
        system_prompt: str,
        tools: Optional[List[Dict]] = None,
        model: Optional[str] = None,
        provider: Optional[BaseProvider] = None,
    ):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.provider = provider or get_provider()
        self.model = model or self.provider.default_model
        self.memory: List[Dict] = []

    def run(self, task: str, context: str = "") -> str:
        user_message = f"{context}\n\nTask: {task}" if context else task
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_message},
        ]

        response = self.provider.create_chat_completion(
            model=self.model,
            messages=messages,
        )

        result = response.choices[0].message.content or ""
        self.memory.extend([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": result},
        ])
        return result

    def run_with_tools(self, task: str, context: str = "") -> str:
        user_message = f"{context}\n\nTask: {task}" if context else task
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_message},
        ]

        while True:
            response = self.provider.create_chat_completion(
                model=self.model,
                messages=messages,
                tools=self.tools or None,
                tool_choice="auto" if self.tools else None,
            )

            choice = response.choices[0]
            message = choice.message

            assistant_msg: Dict = {"role": "assistant", "content": message.content}
            if message.tool_calls:
                assistant_msg["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in message.tool_calls
                ]
            messages.append(assistant_msg)

            if choice.finish_reason == "stop":
                return message.content or ""

            if choice.finish_reason == "tool_calls" and message.tool_calls:
                for tc in message.tool_calls:
                    tool_input = json.loads(tc.function.arguments)
                    result = self._handle_tool(tc.function.name, tool_input)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result,
                    })
            else:
                return message.content or ""

    def _handle_tool(self, tool_name: str, tool_input: Dict) -> str:
        return f"Tool '{tool_name}' not implemented in {self.name}."
