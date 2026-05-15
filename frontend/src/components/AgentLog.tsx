import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AgentLogEntry } from '../types'

interface Props {
  logs: AgentLogEntry[]
  isLoading: boolean
}

export default function AgentLog({ logs, isLoading }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, collapsed])

  if (logs.length === 0 && !isLoading) return null

  return (
    <div className="mx-6 mb-4 border border-slate-700 rounded-xl bg-slate-900 overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-800 transition-colors"
      >
        {isLoading && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        )}
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1 text-left">
          Agent Activity {logs.length > 0 && `(${logs.length})`}
        </span>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 max-h-44 overflow-y-auto font-mono text-xs text-slate-400 space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-slate-600 py-1">Starting agents...</p>
          ) : (
            logs.map((entry) => (
              <p key={entry.id} className="leading-relaxed whitespace-pre-wrap">
                {entry.message}
              </p>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
