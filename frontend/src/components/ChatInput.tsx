import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, X } from 'lucide-react'

interface Props {
  onSend: (query: string, files: File[]) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [value, setValue] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if ((!trimmed && files.length === 0) || isLoading) return
    onSend(trimmed, files)
    setValue('')
    setFiles([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...picked.filter((f) => !existing.has(f.name))]
    })
    e.target.value = ''
  }

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name))

  const canSend = (value.trim().length > 0 || files.length > 0) && !isLoading

  return (
    <div className="p-4 border-t border-slate-800">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f) => (
            <span
              key={f.name}
              className="flex items-center gap-1.5 bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-full"
            >
              <Paperclip className="w-3 h-3 text-slate-400" />
              {f.name}
              <button
                type="button"
                onClick={() => removeFile(f.name)}
                className="text-slate-400 hover:text-slate-200 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-end bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3
                      focus-within:border-blue-500 transition-colors">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="shrink-0 p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.py,.js,.ts,.tsx,.jsx,.json,.md,.csv,.yaml,.yml,.html,.css,.xml,.sh,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask the agents anything…  (Enter to send, Shift+Enter for newline)"
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500
                     resize-none focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 p-2 rounded-xl bg-blue-600 hover:bg-blue-500
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Send"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
      <p className="text-xs text-slate-600 text-center mt-2">
        Flow: Planner → Researcher → Coder → Reviewer → Final result
      </p>
    </div>
  )
}
