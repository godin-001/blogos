import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, first_name, tags } = await req.json()
  const key = req.headers.get('x-convertkit-key') || ''

  if (!key) {
    return NextResponse.json({ error: 'Se requiere API key de ConvertKit' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
  }

  try {
    const body: Record<string, unknown> = {
      api_key: key,
      email_address: email,
    }
    if (first_name) body.first_name = first_name
    if (tags?.length) body.tags = tags

    const res = await fetch(`https://api.convertkit.com/v4/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as Record<string, string>).message || `ConvertKit ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json({
      subscriber: {
        id: data.subscriber?.id || data.id,
        email_address: data.subscriber?.email_address || email,
        state: data.subscriber?.state || 'active',
      },
    })
  } catch (e) {
    console.error('[BlogOS] ConvertKit error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
