import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Paperclip } from 'lucide-react'
import type { Message } from '../types'

const EXAMPLES = [
  'Build a Python REST API with FastAPI',
  'Implement a rate limiter using the token bucket algorithm',
  'Research JWT best practices and write a utility library',
  'Create a Python web scraper for product prices',
]

interface Props {
  messages: Message[]
  isLoading: boolean
  onExample: (q: string) => void
}

export default function MessageList({ messages, isLoading, onExample }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-200 mb-2">Multi-Agent AI System</h2>
          <p className="text-slate-500 text-sm max-w-md">
            A team of specialized agents (Planner, Researcher, Coder, Reviewer) collaborate to
            answer your query. Configure providers in the sidebar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => onExample(q)}
              className="text-left p-3 rounded-xl border border-slate-700 bg-slate-800/50
                         text-sm text-slate-300 hover:border-blue-500 hover:bg-slate-800
                         transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'user' ? (
            <div className="max-w-xl flex flex-col items-end gap-1.5">
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {msg.attachments.map((name) => (
                    <span
                      key={name}
                      className="flex items-center gap-1 bg-blue-700/60 text-blue-200 text-xs px-2.5 py-0.5 rounded-full"
                    >
                      <Paperclip className="w-3 h-3" />
                      {name}
                    </span>
                  ))}
                </div>
              )}
              {msg.content && (
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm">
                  {msg.content}
                </div>
              )}
            </div>
          ) : (
            <div
              className="max-w-3xl bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-4
                         prose prose-invert prose-sm max-w-none"
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 flex gap-1.5 items-center">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
