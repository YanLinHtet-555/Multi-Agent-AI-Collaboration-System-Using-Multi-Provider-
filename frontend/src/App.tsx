import { useState } from 'react'
import { Bot, Settings } from 'lucide-react'
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
        <header className="shrink-0 px-5 py-3.5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600
                            flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-sm leading-tight">Multi-Agent AI</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Collaboration System</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium
                             ${isLoading
                               ? 'bg-amber-500/10 text-amber-400'
                               : 'bg-emerald-500/10 text-emerald-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {isLoading ? 'Agents working…' : 'Ready'}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
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
