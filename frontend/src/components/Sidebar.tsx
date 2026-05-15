import { Brain, Map, Search, Code2, CheckSquare } from 'lucide-react'
import type { ProviderConfig, Provider } from '../types'

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'groq',      label: 'Groq'          },
  { value: 'openai',    label: 'OpenAI'        },
  { value: 'anthropic', label: 'Anthropic'     },
  { value: 'google',    label: 'Google'        },
  { value: 'ollama',    label: 'Ollama (Local)'},
]

const AGENTS = [
  { key: 'manager'    as keyof ProviderConfig, label: 'Manager',    desc: 'Orchestration',  Icon: Brain,       color: 'text-violet-400' },
  { key: 'planner'    as keyof ProviderConfig, label: 'Planner',    desc: 'Task planning',  Icon: Map,         color: 'text-blue-400'   },
  { key: 'researcher' as keyof ProviderConfig, label: 'Researcher', desc: 'Info gathering', Icon: Search,      color: 'text-cyan-400'   },
  { key: 'coder'      as keyof ProviderConfig, label: 'Coder',      desc: 'Code writing',   Icon: Code2,       color: 'text-amber-400'  },
  { key: 'reviewer'   as keyof ProviderConfig, label: 'Reviewer',   desc: 'Quality review', Icon: CheckSquare, color: 'text-emerald-400'},
]

interface Props {
  config: ProviderConfig
  onChange: (config: ProviderConfig) => void
  disabled: boolean
}

export default function Sidebar({ config, onChange, disabled }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Agent Providers
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">Assign a provider per agent</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {AGENTS.map(({ key, label, desc, Icon, color }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
              <span className="text-sm text-slate-200 font-medium">{label}</span>
              <span className="text-xs text-slate-600 ml-auto">{desc}</span>
            </div>
            <select
              value={config[key]}
              disabled={disabled}
              onChange={(e) => onChange({ ...config, [key]: e.target.value as Provider })}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5
                         text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50
                         focus:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed
                         hover:border-slate-600 transition-colors cursor-pointer"
            >
              {PROVIDERS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="px-5 py-3.5 border-t border-slate-800">
        <p className="text-xs text-slate-600">
          Add API keys via{' '}
          <span className="text-slate-500 font-medium">Settings ⚙</span>
        </p>
      </div>
    </aside>
  )
}
