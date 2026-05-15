import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Paperclip, Copy, Check, Bot } from 'lucide-react'
import type { Message } from '../types'

const EXAMPLES = [
  { icon: '⚡', text: 'Build a Python REST API with FastAPI' },
  { icon: '🔒', text: 'Implement a rate limiter using the token bucket algorithm' },
  { icon: '🔑', text: 'Research JWT best practices and write a utility library' },
  { icon: '🕷️', text: 'Create a Python web scraper for product prices' },
]

interface Props {
  messages: Message[]
  isLoading: boolean
  onExample: (q: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md
                 text-slate-600 hover:text-slate-400 hover:bg-slate-700/60"
      title="Copy response"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  )
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20
                          border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">How can I help?</h2>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
            A team of AI agents — Planner, Researcher, Coder, Reviewer — collaborate to solve your task.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
          {EXAMPLES.map(({ icon, text }) => (
            <button
              key={text}
              onClick={() => onExample(text)}
              className="flex items-start gap-3 text-left p-3.5 rounded-xl border border-slate-700/80
                         bg-slate-800/40 text-sm text-slate-300 hover:border-blue-500/50
                         hover:bg-slate-800/80 hover:text-slate-200 transition-all"
            >
              <span className="text-base leading-snug shrink-0">{icon}</span>
              <span className="leading-snug">{text}</span>
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
                      className="flex items-center gap-1 bg-blue-900/40 border border-blue-700/40
                                 text-blue-300 text-xs px-2.5 py-0.5 rounded-full"
                    >
                      <Paperclip className="w-3 h-3" />
                      {name}
                    </span>
                  ))}
                </div>
              )}
              {msg.content && (
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5
                               text-sm leading-relaxed shadow-lg shadow-blue-900/20">
                  {msg.content}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl w-full group flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20
                              border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex mt-1 pl-1">
                  <CopyButton text={msg.content} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20
                          border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
            <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-sm
                          px-4 py-3.5 flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
