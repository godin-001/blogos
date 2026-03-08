import { NextRequest, NextResponse } from 'next/server'
import {
  mockGenerateIdeas,
  mockGenerateSection,
  mockSeoAnalysis,
  mockReflexiveQuestion,
} from '@/lib/mock-ai'

const MODEL = 'claude-opus-4-5'

const SYSTEM = `Eres BlogOS, agente experto en blogs de alto nivel. Hablas en español.
Eres directo, estratégico y motivador. Expertise: SEO, copywriting, storytelling, monetización.`

function cleanResponse(text: string): string {
  return text
    .replace(/^```(?:json|markdown|md)?\s*/gm, '')
    .replace(/\s*```$/gm, '')
    .trim()
}

function buildPrompt(
  mode: string,
  lastMsg: string,
  profile: Record<string, string> | null
): string {
  const niche    = profile?.niche    || 'emprendimiento'
  const audience = profile?.audience || 'emprendedores'
  const style    = profile?.style    || 'profesional'
  const ctx = `Nicho: ${niche} | Audiencia: ${audience} | Estilo: ${style}`

  switch (mode) {
    case 'ideas':
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nGenera exactamente 8 ideas como JSON array. SOLO el JSON, sin markdown ni texto extra:\n[{"titulo":"...","gancho":"...","tipo":"educativo|inspiracional|opinion|tecnico|lista","potencial":"alto|medio","keywords":["kw1","kw2"]}]`
    case 'estructura':
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nResponde SOLO con el contenido de la sección. Máximo 200 palabras. Sin explicaciones ni markdown.`
    case 'seo':
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nResponde SOLO con JSON válido (sin markdown):\n{"score":85,"keyword":"string","metaDesc":"string max 155 chars","titulo_alternativo":["","",""],"fortalezas":["","",""],"mejoras":["","",""],"densidadKw":1.5,"legibilidad":"Buena"}`
    case 'reflexion':
      return `${SYSTEM}\n${ctx}\n\nEl escritor quiere reflexionar sobre: "${lastMsg || niche}".\nHazle UNA sola pregunta reflexiva y profunda. Sin preámbulos. Máximo 3 líneas.`
    default:
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}`
  }
}

function getFallback(
  mode: string,
  lastMsg: string,
  profile: Record<string, string> | null
) {
  const niche    = profile?.niche    || 'emprendimiento'
  const audience = profile?.audience || ''

  if (mode === 'ideas') {
    return { text: JSON.stringify(mockGenerateIdeas(niche, audience, lastMsg)), demo: true }
  }
  if (mode === 'estructura') {
    const sectionMatch = lastMsg.match(/sección a generar:\s*(\w+)/i)
    const tituloMatch  = lastMsg.match(/título:\s*(.+)/i)
    return {
      text: mockGenerateSection(sectionMatch?.[1] || 'gancho', tituloMatch?.[1] || '', niche),
      demo: true,
    }
  }
  if (mode === 'seo') {
    const articuloMatch = lastMsg.match(/ARTÍCULO:\n([\s\S]+)$/i)
    const kwMatch       = lastMsg.match(/KEYWORD OBJETIVO:\s*"([^"]+)"/i)
    return {
      text: JSON.stringify(mockSeoAnalysis(articuloMatch?.[1] || '', kwMatch?.[1] || '')),
      demo: true,
    }
  }
  if (mode === 'reflexion') {
    const topicMatch = lastMsg.match(/sobre:\s*"([^"]+)"/i)
    return {
      text: mockReflexiveQuestion(topicMatch?.[1] || niche, Math.floor(Math.random() * 10)),
      demo: true,
    }
  }
  return { text: 'Responde brevemente a esta pregunta de blog.', demo: true }
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 2000,
    system:     SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return cleanResponse(text)
}

export async function POST(req: NextRequest) {
  const body    = await req.json()
  const { messages, mode, profile } = body
  const lastMsg = messages?.[messages.length - 1]?.content || ''
  const prompt  = buildPrompt(mode, lastMsg, profile)

  // 1️⃣ API key del usuario (enviada desde /configuracion)
  const userKey = req.headers.get('x-anthropic-key') || ''
  if (userKey && userKey.startsWith('sk-')) {
    try {
      const text = await callClaude(prompt, userKey)
      return NextResponse.json({ text, model: MODEL })
    } catch (e) {
      console.error('[BlogOS] User key error:', e)
    }
  }

  // 2️⃣ API key del servidor (variable de entorno en Vercel)
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  if (serverKey && serverKey.startsWith('sk-')) {
    try {
      const text = await callClaude(prompt, serverKey)
      return NextResponse.json({ text, model: MODEL })
    } catch (e) {
      console.error('[BlogOS] Server key error:', e)
    }
  }

  // 3️⃣ Mock inteligente — app 100% funcional sin API key
  return NextResponse.json(getFallback(mode, lastMsg, profile))
}
