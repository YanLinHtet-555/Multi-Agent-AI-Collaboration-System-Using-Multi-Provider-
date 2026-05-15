import { useState } from 'react'
import { Settings } from 'lucide-react'
import type { Message, AgentLogEntry, ProviderConfig } from './types'
import { streamChat } from './api/client'
import type { AttachedFile } from './api/client'
import { extractPdfText } from './utils/pdfExtract'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import AgentLog from './components/AgentLog'
import ChatInput from './components/ChatInput'
import SettingsModal from './components/SettingsModal'

const DEFAULT_CONFIG: ProviderConfig = {
  manager: 'groq',
  planner: 'groq',
  researcher: 'groq',
  coder: 'groq',
  reviewer: 'groq',
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [logs, setLogs] = useState<AgentLogEntry[]>([])
  const [config, setConfig] = useState<ProviderConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleSend = async (query: string, files: File[] = []) => {
    if (!query.trim() && files.length === 0) return
    if (isLoading) return

    const attachedFiles: AttachedFile[] = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        content: f.name.endsWith('.pdf') ? await extractPdfText(f) : await f.text(),
      }))
    )

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        attachments: files.map((f) => f.name),
      },
    ])
    setLogs([])
    setIsLoading(true)

    let resultContent = ''

    streamChat(
      query,
      config,
      attachedFiles,
      (message) =>
        setLogs((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, message },
        ]),
      (content) => {
        resultContent = content
      },
      (error) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: `**Error:** ${error}` },
        ])
        setIsLoading(false)
      },
      () => {
        if (resultContent) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: 'assistant', content: resultContent },
          ])
        }
        setIsLoading(false)
      },
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <Sidebar config={config} onChange={setConfig} disabled={isLoading} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="shrink-0 px-6 py-3 border-b border-slate-800 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <h1 className="font-semibold text-slate-100">Multi-Agent AI Collaboration System</h1>
          <span className="ml-auto text-xs text-slate-500">
            {isLoading ? 'Agents working…' : 'Ready'}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onExample={handleSend}
          />
        </div>

        {/* Agent activity log */}
        <AgentLog logs={logs} isLoading={isLoading} />

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  )
}
