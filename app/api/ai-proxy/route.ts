/**
 * /api/ai-proxy — Proxy interno de IA
 *
 * Cuando BlogOS corre en Vercel (sin Claude CLI ni OAuth),
 * redirige las peticiones al servidor local a través del túnel de Cloudflare,
 * donde sí está disponible el Claude CLI con OAuth.
 *
 * Solo se usa si la variable PROXY_TARGET_URL está configurada.
 */
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const target = process.env.PROXY_TARGET_URL
  if (!target) {
    return NextResponse.json({ error: 'No proxy configured' }, { status: 503 })
  }

  try {
    const body = await req.text()
    const res  = await fetch(`${target}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(40000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[BlogOS] Proxy error:', e)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}
