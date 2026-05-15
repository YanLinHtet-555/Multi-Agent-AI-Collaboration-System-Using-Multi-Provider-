import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Activity } from 'lucide-react'
import type { AgentLogEntry } from '../types'

interface Props {
  logs: AgentLogEntry[]
  isLoading: boolean
}

const AGENT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  manager:    { label: 'Manager',    color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  planner:    { label: 'Planner',    color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20'     },
  researcher: { label: 'Researcher', color: 'text-cyan-400',   bg: 'bg-cyan-400/10 border-cyan-400/20'     },
  coder:      { label: 'Coder',      color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/20'   },
  reviewer:   { label: 'Reviewer',   color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/20'},
}

function parseLogEntry(message: string) {
  const match = message.match(/^\[([^\]]+)\]\s*(.*)$/s)
  if (!match) return { agentKey: null, text: message }
  return { agentKey: match[1].toLowerCase(), text: match[2] }
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
    <div className="mx-4 mb-3 border border-slate-700/60 rounded-xl bg-slate-900/80 overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-800/50 transition-colors"
      >
        <Activity className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1 text-left">
          Agent Activity
          {logs.length > 0 && (
            <span className="ml-2 font-normal normal-case tracking-normal text-slate-600">
              · {logs.length} {logs.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </span>
        {collapsed
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          : <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
        }
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-1.5 border-t border-slate-800">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-600 py-2 font-mono">Initializing agents…</p>
          ) : (
            logs.map((entry, idx) => {
              const { agentKey, text } = parseLogEntry(entry.message)
              const style = agentKey ? AGENT_STYLES[agentKey] : null
              return (
                <div key={entry.id} className="flex items-start gap-2.5 text-xs font-mono pt-1.5">
                  <span className="text-slate-700 tabular-nums shrink-0 select-none w-5 text-right">
                    {idx + 1}
                  </span>
                  {style ? (
                    <>
                      <span className={`border ${style.bg} ${style.color} px-1.5 py-px rounded text-[10px] font-semibold shrink-0`}>
                        {style.label}
                      </span>
                      <span className="text-slate-400 leading-relaxed whitespace-pre-wrap break-words min-w-0">
                        {text}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 leading-relaxed whitespace-pre-wrap break-words min-w-0">
                      {entry.message}
                    </span>
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
