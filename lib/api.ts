/**
 * BlogOS API helper — injects stored API keys into every request
 */

export function getStoredKeys(): { anthropic: string; serper: string; newsapi: string } {
  if (typeof window === 'undefined') return { anthropic: '', serper: '', newsapi: '' }
  const stored = localStorage.getItem('blogos_api_keys')
  return stored ? JSON.parse(stored) : { anthropic: '', serper: '', newsapi: '' }
}

export function getProfile(): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('blogos_profile')
  return stored ? JSON.parse(stored) : null
}

export async function callChat(payload: {
  messages: { role: string; content: string }[]
  mode?: string
  profile?: Record<string, string> | null
}) {
  const keys = getStoredKeys()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (keys.anthropic) headers['x-anthropic-key'] = keys.anthropic

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function callSeoResearch(payload: { keyword?: string; niche?: string }) {
  const keys = getStoredKeys()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (keys.serper) headers['x-serper-key'] = keys.serper

  const res = await fetch('/api/seo-research', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function callTendencias(payload: { niche?: string; language?: string }) {
  const keys = getStoredKeys()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (keys.newsapi) headers['x-news-key'] = keys.newsapi

  const res = await fetch('/api/tendencias', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return res.json()
}
