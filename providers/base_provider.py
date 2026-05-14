from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class ToolFunction:
    name: str
    arguments: str  # JSON string


@dataclass
class ToolCall:
    id: str
    function: ToolFunction
    type: str = "function"


@dataclass
class Message:
    content: Optional[str]
    tool_calls: Optional[List[ToolCall]] = None


@dataclass
class Choice:
    message: Message
    finish_reason: str


@dataclass
class ChatResponse:
    choices: List[Choice]


class ProviderRateLimitError(Exception):
    pass


class ProviderBadRequestError(Exception):
    def __init__(self, message: str, body: Optional[Dict] = None):
        super().__init__(message)
        self.body = body or {}


class BaseProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def default_model(self) -> str:
        pass

    @property
    @abstractmethod
    def manager_model(self) -> str:
        pass

    @abstractmethod
    def create_chat_completion(
        self,
        model: str,
        messages: List[Dict],
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None,
    ) -> ChatResponse:
        pass
