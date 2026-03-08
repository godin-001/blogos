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

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model:      MODEL,
    max_tokens: 2000,
    system:     SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  return cleanResponse(text)
}

// ── Handler ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body    = await req.json()
  const { messages, mode, profile } = body
  const lastMsg = messages?.[messages.length - 1]?.content || ''

  // 1️⃣ API key explícita del usuario (enviada desde /configuracion)
  const userKey = req.headers.get('x-anthropic-key') || ''
  if (userKey && userKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callClaude(prompt, userKey)
      return NextResponse.json({ text, model: MODEL })
    } catch (e) {
      console.error('[BlogOS] User key error:', e)
    }
  }

  // 2️⃣ API key del servidor (variable de entorno — para Vercel)
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  if (serverKey && serverKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callClaude(prompt, serverKey)
      return NextResponse.json({ text, model: MODEL })
    } catch (e) {
      console.error('[BlogOS] Server key error:', e)
    }
  }

  // 3️⃣ Proxy al servidor local con OAuth (tunnel de Cloudflare)
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
        return NextResponse.json({ ...data, model: `${MODEL} (proxy)` })
      }
    } catch (e) {
      console.error('[BlogOS] Proxy error:', e)
    }
  }

  // 4️⃣ Claude CLI con OAuth (solo disponible en servidor local)
  try {
    const { spawn } = await import('child_process')
    const { default: fs } = await import('fs')
    const { default: path } = await import('path')
    const { default: os } = await import('os')

    const CLAUDE_BIN = '/home/devrel-frutero/.local/bin/claude'
    if (fs.existsSync(CLAUDE_BIN)) {
      const prompt  = buildPrompt(mode, lastMsg, profile)
      const tmpFile = path.join(os.tmpdir(), `blogos-${Date.now()}.txt`)
      fs.writeFileSync(tmpFile, prompt, 'utf8')

      const { ANTHROPIC_API_KEY: _k, ...cleanEnv } = process.env as Record<string, string>
      const text = await new Promise<string>((resolve, reject) => {
        const proc = spawn('bash', ['-c', `cat "${tmpFile}" | "${CLAUDE_BIN}" --print`], {
          timeout: 35000,
          env: {
            ...cleanEnv,
            HOME: '/home/devrel-frutero',
            PATH: '/home/devrel-frutero/.local/bin:/home/devrel-frutero/.nvm/versions/node/v24.13.1/bin:/usr/local/bin:/usr/bin:/bin',
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
      return NextResponse.json({ text, model: `${MODEL} (oauth)` })
    }
  } catch (e) {
    console.error('[BlogOS] Claude CLI error:', e)
  }

  // 5️⃣ Mock inteligente — siempre funciona, nunca muestra errores
  return NextResponse.json(getFallback(mode, lastMsg, profile))
}
