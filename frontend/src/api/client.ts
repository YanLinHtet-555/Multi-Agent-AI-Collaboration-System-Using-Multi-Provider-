import type { ProviderConfig } from '../types'

export interface AttachedFile {
  name: string
  content: string
}

export function streamChat(
  query: string,
  providerConfig: ProviderConfig,
  files: AttachedFile[],
  onLog: (message: string) => void,
  onResult: (content: string) => void,
  onError: (message: string) => void,
  onDone: () => void,
): () => void {
  const controller = new AbortController()

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, provider_config: providerConfig, files }),
    signal: controller.signal,
  })
    .then(async (response) => {
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'agent_log') onLog(event.message)
            else if (event.type === 'result') onResult(event.content)
            else if (event.type === 'error') onError(event.message)
            else if (event.type === 'done') onDone()
          } catch {
            // ignore malformed lines
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(String(err))
    })

  return () => controller.abort()
}
