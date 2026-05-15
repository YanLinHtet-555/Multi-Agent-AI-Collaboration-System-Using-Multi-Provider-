import type { ProviderConfig, Provider } from '../types'

const PROVIDERS: Provider[] = ['groq', 'openai', 'anthropic', 'google', 'ollama']

const AGENTS: { key: keyof ProviderConfig; label: string; desc: string }[] = [
  { key: 'manager',    label: 'Manager',    desc: 'Orchestration' },
  { key: 'planner',    label: 'Planner',    desc: 'Task planning' },
  { key: 'researcher', label: 'Researcher', desc: 'Info gathering' },
  { key: 'coder',      label: 'Coder',      desc: 'Code writing' },
  { key: 'reviewer',   label: 'Reviewer',   desc: 'Code review' },
]

interface Props {
  config: ProviderConfig
  onChange: (config: ProviderConfig) => void
  disabled: boolean
}

export default function Sidebar({ config, onChange, disabled }: Props) {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Provider Config
        </h2>
        <p className="text-xs text-slate-600 mt-1">Assign a provider per agent</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {AGENTS.map(({ key, label, desc }) => (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-slate-200 font-medium">{label}</span>
              <span className="text-xs text-slate-500">{desc}</span>
            </div>
            <select
              value={config[key]}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, [key]: e.target.value as Provider })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5
                         text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-600 space-y-1">
        <p>Only set keys for providers you use in <code className="text-slate-500">.env</code></p>
      </div>
    </aside>
  )
}
