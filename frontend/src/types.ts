export type Provider = 'groq' | 'openai' | 'anthropic' | 'google' | 'ollama'

export interface ProviderConfig {
  manager: Provider
  planner: Provider
  researcher: Provider
  coder: Provider
  reviewer: Provider
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: string[]
}

export interface AgentLogEntry {
  id: string
  message: string
}
