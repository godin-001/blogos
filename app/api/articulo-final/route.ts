import { NextRequest, NextResponse } from 'next/server'

const PERSONA = `Eres un escritor profesional de blogs con 10 años de experiencia en content marketing hispanohablante.
Produces artículos de alta calidad, bien estructurados, con prosa fluida y atractiva.
No usas frases de relleno. Cada párrafo aporta valor. Tu estilo es claro, directo y humano.`

function buildArticlePrompt(sections: Record<string, string>, profile: Record<string, string> | null, metodologia?: string): string {
  const niche    = profile?.niche    || 'marketing digital'
  const audience = profile?.audience || 'emprendedores hispanohablantes'
  const style    = profile?.style    || 'profesional pero cercano'

  return `${PERSONA}

DATOS DEL AUTOR:
- Nicho: ${niche}
- Audiencia: ${audience}
- Estilo de escritura: ${style}
${metodologia ? `- Metodología base: ${metodologia}` : ''}

MATERIAL DEL ARTÍCULO (secciones escritas por el autor):
TÍTULO: ${sections.titulo || 'Sin título'}
GANCHO INICIAL: ${sections.gancho || ''}
ESTRUCTURA / SUBTÍTULOS: ${sections.subtitulos || ''}
EJEMPLOS E HISTORIAS: ${sections.ejemplos || ''}
REFLEXIÓN FINAL: ${sections.reflexion || ''}
LLAMADO A LA ACCIÓN: ${sections.cta || ''}

TAREA:
Usando todo el material anterior como base, escribe un artículo de blog COMPLETO y PUBLICABLE.

INSTRUCCIONES OBLIGATORIAS:
1. Mantén el título exacto del autor
2. Usa el gancho del autor como apertura (puedes pulirlo pero no cambiarlo drásticamente)
3. Desarrolla cada subtítulo en 2-3 párrafos de prosa fluida (no bullets, no listas a menos que el contenido lo requiera naturalmente)
4. Integra los ejemplos e historias en el lugar que más impacto tengan
5. Cierra con la reflexión del autor seguida del CTA
6. Longitud objetivo: 900-1200 palabras
7. Formato markdown: usa ## para subtítulos, **negrita** para conceptos clave, nada más
8. Tono: ${style}
9. Escribe para humanos, no para robots. Varía el ritmo entre frases cortas y largas.
10. El artículo debe poder publicarse HOY, sin edición adicional

ESCRIBE SOLO EL ARTÍCULO EN MARKDOWN. Sin preámbulos, sin explicaciones, sin notas al final.`
}

function cleanResponse(text: string): string {
  return text.replace(/^```(?:markdown|md)?\s*/gm, '').replace(/\s*```$/gm, '').trim()
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    system: PERSONA,
    messages: [{ role: 'user', content: prompt }],
  })
  return cleanResponse(res.content[0].type === 'text' ? res.content[0].text : '')
}

async function callClaudeStream(prompt: string, apiKey: string): Promise<ReadableStream> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    system: PERSONA,
    messages: [{ role: 'user', content: prompt }],
  })
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) { controller.error(err) }
    },
  })
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: prompt }],
      max_tokens: 4000, temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.choices?.[0]?.message?.content || '')
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: PERSONA }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sections, profile, metodologia } = body
  const wantsStream = req.headers.get('x-stream') === 'true'

  if (!sections?.titulo?.trim()) {
    return NextResponse.json({ error: 'Se necesita al menos el título' }, { status: 400 })
  }

  const prompt = buildArticlePrompt(sections, profile, metodologia)

  // 1. Claude streaming
  const userKey   = req.headers.get('x-anthropic-key') || ''
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  const claudeKey = userKey || serverKey
  if (claudeKey?.startsWith('sk-')) {
    try {
      if (wantsStream) {
        const stream = await callClaudeStream(prompt, claudeKey)
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Model': 'claude-sonnet-4-5' },
        })
      }
      const text = await callClaude(prompt, claudeKey)
      return NextResponse.json({ text, model: 'claude-sonnet-4-5', words: text.split(/\s+/).length })
    } catch (e) { console.error('[articulo-final/Claude]', e) }
  }

  // 2. Groq
  const groqKey = req.headers.get('x-groq-key') || process.env.GROQ_API_KEY || ''
  if (groqKey?.startsWith('gsk_')) {
    try {
      const text = await callGroq(prompt, groqKey)
      return NextResponse.json({ text, model: 'groq/llama-3.3-70b', words: text.split(/\s+/).length })
    } catch (e) { console.error('[articulo-final/Groq]', e) }
  }

  // 3. Gemini
  const gemKey = req.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY || ''
  if (gemKey) {
    try {
      const text = await callGemini(prompt, gemKey)
      return NextResponse.json({ text, model: 'gemini/2.0-flash', words: text.split(/\s+/).length })
    } catch (e) { console.error('[articulo-final/Gemini]', e) }
  }

  return NextResponse.json({ error: 'Configura tu API de IA en Configuración', demo: true }, { status: 503 })
}
