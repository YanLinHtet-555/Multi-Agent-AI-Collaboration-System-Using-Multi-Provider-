from typing import List
from pydantic import BaseModel


class ProviderConfig(BaseModel):
    manager: str = "groq"
    planner: str = "groq"
    researcher: str = "groq"
    coder: str = "groq"
    reviewer: str = "groq"


class AttachedFile(BaseModel):
    name: str
    content: str


class ChatRequest(BaseModel):
    query: str
    provider_config: ProviderConfig = ProviderConfig()
    files: List[AttachedFile] = []
