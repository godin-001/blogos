import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, { ok: boolean; mode: string; latency?: number }> = {}

  // 1. Proxy via tunnel
  const proxyUrl = process.env.PROXY_TARGET_URL || ''
  if (proxyUrl) {
    const t = Date.now()
    try {
      const res = await fetch(`${proxyUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'di solo: OK' }],
          mode: 'default',
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) {
        const data = await res.json()
        checks.proxy = { ok: true, mode: 'proxy', latency: Date.now() - t }
        if (data.text) checks.proxy.mode = 'proxy → oauth'
      } else {
        checks.proxy = { ok: false, mode: 'proxy error' }
      }
    } catch {
      checks.proxy = { ok: false, mode: 'proxy offline' }
    }
  } else {
    checks.proxy = { ok: false, mode: 'no tunnel configured' }
  }

  // 2. Server env key
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  checks.serverKey = {
    ok: serverKey.startsWith('sk-'),
    mode: serverKey.startsWith('sk-') ? 'server env key' : 'no server key',
  }

  // Determine overall AI status
  const aiWorking = checks.proxy?.ok || checks.serverKey?.ok
  const aiMode = checks.proxy?.ok
    ? `Proxy activo (${checks.proxy.latency}ms)`
    : checks.serverKey?.ok
      ? 'Server env key'
      : 'Modo demo (mock data)'

  return NextResponse.json({
    status: aiWorking ? 'live' : 'demo',
    mode: aiMode,
    proxyUrl: proxyUrl ? proxyUrl.replace(/https?:\/\//, '').split('.')[0] + '...' : null,
    checks,
    timestamp: new Date().toISOString(),
  })
}
