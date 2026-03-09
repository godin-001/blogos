import { NextRequest, NextResponse } from 'next/server'

// Modelo gratuito: gemini-1.5-flash (15 req/min gratis)
const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages } = body

    const userKey = req.headers.get('x-gemini-key') || ''
    const serverKey = process.env.GEMINI_API_KEY || ''
    const key = userKey || serverKey

    if (!key) {
      return NextResponse.json({ error: 'Gemini API key no configurada', demo: true }, { status: 401 })
    }

    // Convertir messages de OpenAI format a Gemini format
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const payload = {
      contents,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    }

    const start = Date.now()
    const res = await fetch(GEMINI_URL(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Gemini error: ${res.status}`, detail: err, demo: true }, { status: res.status })
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const latency = Date.now() - start

    return NextResponse.json({
      text,
      model: `gemini/${GEMINI_MODEL}`,
      latency,
      demo: false,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e), demo: true }, { status: 500 })
  }
}
