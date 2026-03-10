'use client'

import { useState, useCallback } from 'react'
import { getStoredKeys, getProfile } from '@/lib/api'

interface StreamPayload {
  messages: { role: string; content: string }[]
  mode?: string
  profile?: Record<string, string> | null
}

interface UseStreamingChatReturn {
  streamText: (
    payload: StreamPayload,
    onChunk: (text: string, accumulated: string) => void,
    onDone: (fullText: string) => void,
    onError?: (err: Error) => void
  ) => Promise<void>
  isStreaming: boolean
  error: string | null
  abort: () => void
}

export function useStreamingChat(): UseStreamingChatReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [controller, setController] = useState<AbortController | null>(null)

  const abort = useCallback(() => {
    controller?.abort()
    setIsStreaming(false)
  }, [controller])

  const streamText = useCallback(async (
    payload: StreamPayload,
    onChunk: (text: string, accumulated: string) => void,
    onDone: (fullText: string) => void,
    onError?: (err: Error) => void
  ) => {
    setIsStreaming(true)
    setError(null)

    const keys    = getStoredKeys()
    const profile = getProfile()
    const ac      = new AbortController()
    setController(ac)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-stream':     'true',  // activa streaming en el servidor
    }
    if (keys.anthropic) headers['x-anthropic-key'] = keys.anthropic
    if (keys.groq)      headers['x-groq-key']      = keys.groq
    if (keys.gemini)    headers['x-gemini-key']     = keys.gemini

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers,
        body:    JSON.stringify({ ...payload, profile: payload.profile ?? profile }),
        signal:  ac.signal,
      })

      // Si el servidor no soporta stream (Groq/Gemini/Mock), retorna JSON normal
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const data = await res.json()
        const text = data.text || ''
        onChunk(text, text)
        onDone(text)
        setIsStreaming(false)
        return
      }

      // Procesar SSE stream
      const reader  = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('No reader available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw   = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.chunk) {
              accumulated += parsed.chunk
              onChunk(parsed.chunk, accumulated)
            }
          } catch {
            // ignorar líneas no-JSON
          }
        }
      }

      onDone(accumulated)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
    } finally {
      setIsStreaming(false)
      setController(null)
    }
  }, [])

  return { streamText, isStreaming, error, abort }
}
