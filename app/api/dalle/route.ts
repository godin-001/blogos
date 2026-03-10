import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { titulo, niche } = await req.json()
  const key = req.headers.get('x-openai-key') || ''

  if (!key) {
    return NextResponse.json({ error: 'Se requiere API key de OpenAI', url: '' }, { status: 400 })
  }

  try {
    const prompt = `Professional blog cover image for an article about: ${titulo}. Style: modern, clean, ${niche || 'technology'} industry. No text in image.`

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as Record<string, Record<string, string>>).error?.message || `DALL-E ${res.status}`)
    }

    const data = await res.json()
    const url = data.data?.[0]?.url || ''

    return NextResponse.json({ url })
  } catch (e) {
    console.error('[BlogOS] DALL-E error:', e)
    return NextResponse.json({ error: String(e), url: '' })
  }
}
