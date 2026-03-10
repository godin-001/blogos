import { NextRequest, NextResponse } from 'next/server'
import {
  mockGenerateIdeas,
  mockGenerateSection,
  mockSeoAnalysis,
  mockReflexiveQuestion,
} from '@/lib/mock-ai'

// ── Modelos por tarea ─────────────────────────────────────────────
// Usa el modelo más económico para tareas simples, el potente para análisis
const MODELS = {
  fast:     'claude-haiku-4-5',    // ideas, hooks, estructura — rápido y barato
  analysis: 'claude-opus-4-5',     // SEO, reflexión — necesita más inteligencia
  default:  'claude-opus-4-5',
}

function getModelForMode(mode: string): string {
  if (['ideas', 'hooks', 'estructura'].includes(mode)) return MODELS.fast
  if (['seo', 'reflexion'].includes(mode)) return MODELS.analysis
  return MODELS.default
}

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
  const ctx      = `Nicho: ${niche} | Audiencia: ${audience} | Estilo: ${style}`

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

// ── Llamadas a modelos de IA ─────────────────────────────────────

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model,
    max_tokens: 2000,
    system:     SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  return cleanResponse(text)
}

async function callClaudeStream(
  prompt: string,
  apiKey: string,
  model: string
): Promise<ReadableStream> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const stream = client.messages.stream({
    model,
    max_tokens: 2000,
    system:     SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const data = JSON.stringify({ chunk: chunk.delta.text })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const GROQ_MODEL = 'llama-3.1-70b-versatile'
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.choices?.[0]?.message?.content || '')
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const GEMINI_MODEL = 'gemini-2.0-flash-exp'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

async function callOpenAI(prompt: string, apiKey: string, mode: string): Promise<string> {
  const model = ['ideas', 'hooks', 'estructura'].includes(mode) ? 'gpt-4o-mini' : 'gpt-4o'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.choices?.[0]?.message?.content || '')
}

async function callMistral(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.choices?.[0]?.message?.content || '')
}

// ── Handler principal ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body    = await req.json()
  const { messages, mode, profile } = body
  const lastMsg = messages?.[messages.length - 1]?.content || ''

  const wantsStream = req.headers.get('x-stream') === 'true'
  const model       = getModelForMode(mode || 'default')

  // 1️⃣ API key del usuario — con soporte de streaming
  const userKey = req.headers.get('x-anthropic-key') || ''
  if (userKey && userKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)

      if (wantsStream) {
        const stream = await callClaudeStream(prompt, userKey, model)
        return new Response(stream, {
          headers: {
            'Content-Type':  'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection':    'keep-alive',
            'X-Model':       `${model} (stream)`,
          },
        })
      }

      const text = await callClaude(prompt, userKey, model)
      return NextResponse.json({ text, model })
    } catch (e) {
      console.error('[BlogOS] User key error:', e)
    }
  }

  // 2️⃣ API key del servidor
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  if (serverKey && serverKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)

      if (wantsStream) {
        const stream = await callClaudeStream(prompt, serverKey, model)
        return new Response(stream, {
          headers: {
            'Content-Type':  'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection':    'keep-alive',
            'X-Model':       `${model} (stream)`,
          },
        })
      }

      const text = await callClaude(prompt, serverKey, model)
      return NextResponse.json({ text, model })
    } catch (e) {
      console.error('[BlogOS] Server key error:', e)
    }
  }

  // 3️⃣ Groq API — ultra-rápida, tier gratuito
  const userGroqKey   = req.headers.get('x-groq-key') || ''
  const serverGroqKey = process.env.GROQ_API_KEY || ''
  const groqKey       = userGroqKey || serverGroqKey
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callGroq(prompt, groqKey)
      return NextResponse.json({ text, model: 'groq/llama-3.1-70b' })
    } catch (e) {
      console.error('[BlogOS] Groq error:', e)
    }
  }

  // 4️⃣ Gemini API — gratuito (actualizado a 2.0 flash)
  const userGemKey   = req.headers.get('x-gemini-key') || ''
  const serverGemKey = process.env.GEMINI_API_KEY || ''
  const gemKey       = userGemKey || serverGemKey
  if (gemKey) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callGemini(prompt, gemKey)
      return NextResponse.json({ text, model: 'gemini/2.0-flash-exp' })
    } catch (e) {
      console.error('[BlogOS] Gemini error:', e)
    }
  }

  // 5️⃣ OpenAI GPT-4o — alternativa a Claude
  const userOpenAIKey   = req.headers.get('x-openai-key') || ''
  const serverOpenAIKey = process.env.OPENAI_API_KEY || ''
  const openaiKey       = userOpenAIKey || serverOpenAIKey
  if (openaiKey && openaiKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callOpenAI(prompt, openaiKey, mode || 'default')
      const usedModel = ['ideas', 'hooks', 'estructura'].includes(mode || '') ? 'gpt-4o-mini' : 'gpt-4o'
      return NextResponse.json({ text, model: `openai/${usedModel}` })
    } catch (e) {
      console.error('[BlogOS] OpenAI error:', e)
    }
  }

  // 6️⃣ Mistral AI — gratuito, europeo
  const userMistralKey   = req.headers.get('x-mistral-key') || ''
  const serverMistralKey = process.env.MISTRAL_API_KEY || ''
  const mistralKey       = userMistralKey || serverMistralKey
  if (mistralKey) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callMistral(prompt, mistralKey)
      return NextResponse.json({ text, model: 'mistral/small-latest' })
    } catch (e) {
      console.error('[BlogOS] Mistral error:', e)
    }
  }

  // 7️⃣ Proxy al servidor local con OAuth (tunnel de Cloudflare)
  const proxyUrl = process.env.PROXY_TARGET_URL || ''
  if (proxyUrl) {
    try {
      const res = await fetch(`${proxyUrl}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages, mode, profile }),
        signal:  AbortSignal.timeout(40000),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ ...data, model: `${model} (proxy)` })
      }
    } catch (e) {
      console.error('[BlogOS] Proxy error:', e)
    }
  }

  // 8️⃣ Claude CLI con OAuth (solo disponible en servidor local)
  try {
    const { spawn } = await import('child_process')
    const { default: fs } = await import('fs')
    const { default: path } = await import('path')
    const { default: os } = await import('os')

    const CLAUDE_BIN = process.env.CLAUDE_CLI_PATH || '/home/devrel-frutero/.local/bin/claude'
    if (fs.existsSync(CLAUDE_BIN)) {
      const prompt  = buildPrompt(mode, lastMsg, profile)
      const tmpFile = path.join(os.tmpdir(), `blogos-${Date.now()}.txt`)
      fs.writeFileSync(tmpFile, prompt, 'utf8')

      const cleanEnv: NodeJS.ProcessEnv = { ...process.env }
      delete cleanEnv.ANTHROPIC_API_KEY
      const text = await new Promise<string>((resolve, reject) => {
        const proc = spawn('bash', ['-c', `cat "${tmpFile}" | "${CLAUDE_BIN}" --print`], {
          timeout: 35000,
          env: {
            ...cleanEnv,
            HOME: process.env.HOME || '/home/devrel-frutero',
            PATH: `${process.env.HOME || '/home/devrel-frutero'}/.local/bin:${process.env.HOME || '/home/devrel-frutero'}/.nvm/versions/node/v24.13.1/bin:/usr/local/bin:/usr/bin:/bin`,
          },
        })
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
        proc.on('close', (code: number) => {
          try { fs.unlinkSync(tmpFile) } catch {}
          if (stdout.trim()) resolve(cleanResponse(stdout.trim()))
          else reject(new Error(`CLI exit ${code}: ${stderr.slice(0, 200)}`))
        })
        proc.on('error', (err: Error) => {
          try { fs.unlinkSync(tmpFile) } catch {}
          reject(err)
        })
      })
      return NextResponse.json({ text, model: `${model} (oauth)` })
    }
  } catch (e) {
    console.error('[BlogOS] Claude CLI error:', e)
  }

  // 9️⃣ Mock inteligente — siempre funciona
  return NextResponse.json(getFallback(mode, lastMsg, profile))
}
