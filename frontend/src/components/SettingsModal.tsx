import { useEffect, useState } from 'react'
import { X, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'

interface KeyStatus {
  groq: boolean
  openai: boolean
  anthropic: boolean
  google: boolean
  ollama_url: boolean
  ollama_model: boolean
  ollama_manager_model: boolean
}

interface FormValues {
  groq: string
  openai: string
  anthropic: string
  google: string
  ollama_url: string
  ollama_model: string
  ollama_manager_model: string
}

interface Props {
  onClose: () => void
}

const API_FIELDS: { key: keyof FormValues; label: string; placeholder: string; isKey: boolean }[] = [
  { key: 'groq',      label: 'Groq API Key',      placeholder: 'gsk_...', isKey: true },
  { key: 'openai',    label: 'OpenAI API Key',     placeholder: 'sk-...',  isKey: true },
  { key: 'anthropic', label: 'Anthropic API Key',  placeholder: 'sk-ant-...', isKey: true },
  { key: 'google',    label: 'Google API Key',     placeholder: 'AIza...', isKey: true },
]

const OLLAMA_FIELDS: { key: keyof FormValues; label: string; placeholder: string; isKey: boolean }[] = [
  { key: 'ollama_url',           label: 'Ollama Base URL',     placeholder: 'http://localhost:11434/v1', isKey: false },
  { key: 'ollama_model',         label: 'Ollama Agent Model',  placeholder: 'llama3.2',                 isKey: false },
  { key: 'ollama_manager_model', label: 'Ollama Manager Model',placeholder: 'llama3.1',                 isKey: false },
]

const EMPTY: FormValues = {
  groq: '', openai: '', anthropic: '', google: '',
  ollama_url: '', ollama_model: '', ollama_manager_model: '',
}

export default function SettingsModal({ onClose }: Props) {
  const [status, setStatus] = useState<KeyStatus | null>(null)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [visible, setVisible] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setStatus)
      .catch(console.error)
  }, [])

  const set = (key: keyof FormValues, val: string) =>
    setValues((v) => ({ ...v, [key]: val }))

  const toggleVisible = (key: keyof FormValues) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      // refresh status
      const updated = await fetch('/api/settings').then((r) => r.json())
      setStatus(updated)
      setValues(EMPTY)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: typeof API_FIELDS[0]) => {
    const isSet = status?.[field.key]
    const isVis = visible[field.key]
    return (
      <div key={field.key}>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm text-slate-300">{field.label}</label>
          {isSet && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Set
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type={field.isKey && !isVis ? 'password' : 'text'}
            value={values[field.key]}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={isSet ? '••••••••  (leave blank to keep current)' : field.placeholder}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                       text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {field.isKey && (
            <button
              type="button"
              onClick={() => toggleVisible(field.key)}
              className="px-3 text-slate-500 hover:text-slate-300 border border-slate-700
                         rounded-lg bg-slate-800 transition-colors"
            >
              {isVis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4
                      shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* API Keys */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              API Keys
            </h3>
            <div className="space-y-4">
              {API_FIELDS.map(renderField)}
            </div>
          </section>

          {/* Ollama */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Ollama (local)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              No API key needed — runs on your machine. Customize the URL and models below.
            </p>
            <div className="space-y-4">
              {OLLAMA_FIELDS.map(renderField)}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-600">Keys are saved to your <code>.env</code> file.</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                       disabled:opacity-50 text-white text-sm font-medium rounded-lg
                       transition-colors"
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
