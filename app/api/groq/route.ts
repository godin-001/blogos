import { NextRequest, NextResponse } from 'next/server'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
// Modelos gratuitos Groq: llama-3.1-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
const MODEL = 'llama-3.1-70b-versatile'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages } = body

    // Intentar clave del usuario primero
    const userKey = req.headers.get('x-groq-key') || ''
    const serverKey = process.env.GROQ_API_KEY || ''
    const key = userKey || serverKey

    if (!key) {
      return NextResponse.json({ error: 'Groq API key no configurada', demo: true }, { status: 401 })
    }

    const payload = {
      model: MODEL,
      messages: messages || [{ role: 'user', content: 'hola' }],
      max_tokens: 2000,
      temperature: 0.7,
    }

    const start = Date.now()
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Groq error: ${res.status}`, detail: err, demo: true }, { status: res.status })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    const latency = Date.now() - start

    return NextResponse.json({
      text,
      model: `groq/${MODEL}`,
      latency,
      demo: false,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e), demo: true }, { status: 500 })
  }
}
