import { NextRequest, NextResponse } from 'next/server'
import {
  mockGenerateIdeas,
  mockGenerateSection,
  mockSeoAnalysis,
  mockReflexiveQuestion,
} from '@/lib/mock-ai'

const MODEL = 'claude-opus-4-5'

const SYSTEM = `Eres BlogOS IA — el agente de contenido más avanzado para bloggers en español.
Principios: claridad brutal, storytelling preciso, SEO sin sacrificar voz.
Expertise: copywriting directo-respuesta, storytelling narrativo, SEO semántico, monetización de contenido.
Reglas de respuesta:
- NUNCA uses markdown en respuestas JSON — devuelve solo JSON puro
- Sé directo y específico — sin relleno ni introducciones
- Cada frase debe ganar su lugar o no existe
- Adapta voz y tono al nicho y audiencia del usuario
- Habla en español latinoamericano profesional`

// Temperatura óptima por modo
const TEMPERATURE_BY_MODE: Record<string, number> = {
  ideas:      0.9,
  titulos:    0.9,
  hooks:      0.9,
  reflexion:  0.8,
  estructura: 0.7,
  seo:        0.3,
}

function getTemperature(mode: string): number {
  return TEMPERATURE_BY_MODE[mode] ?? 0.7
}

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
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nGenera exactamente 8 ideas de artículos de alto impacto como JSON array. SOLO el JSON, sin markdown ni texto extra:\n[{"titulo":"...","gancho":"...","tipo":"educativo|inspiracional|opinion|tecnico|lista|caso-estudio|herramientas|tendencias","potencial":"alto|medio","keywords":["kw1","kw2"]}]`

    case 'titulos':
      return `${SYSTEM}\n${ctx}\n\nEl tema o idea del artículo es: "${lastMsg}"\n\nGenera exactamente 10 títulos alternativos poderosos para este artículo. Cada uno con un enfoque distinto. SOLO JSON array, sin markdown ni texto extra:\n[{"titulo":"...","tipo":"curiosidad|beneficio|numeros|pregunta|urgencia|contraste|historia|promesa","porque":"Por qué funciona este título en 1 frase"}]`

    case 'hooks':
      return `${SYSTEM}\n${ctx}\n\nEl artículo es: "${lastMsg}"\n\nGenera 5 ganchos de apertura distintos y poderosos (primeras 2-3 oraciones que enganchan al lector). Cada uno con un estilo diferente. SOLO JSON array, sin markdown ni texto extra:\n[{"tipo":"historia|pregunta|estadistica|controversia|promesa|dolor|contraste","texto":"..."}]`

    case 'estructura':
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nResponde SOLO con el contenido de la sección. Máximo 200 palabras. Sin explicaciones ni markdown. Voz directa y específica.`

    case 'seo':
      return `${SYSTEM}\n${ctx}\n\n${lastMsg}\n\nResponde SOLO con JSON válido (sin markdown):\n{"score":85,"keyword":"string","metaDesc":"string max 155 chars","titulo_alternativo":["","",""],"fortalezas":["","",""],"mejoras":["","",""],"densidadKw":1.5,"legibilidad":"Buena"}`

    case 'reflexion':
      return `${SYSTEM}\n${ctx}\n\nEl escritor quiere reflexionar sobre: "${lastMsg || niche}".\nHazle UNA sola pregunta reflexiva y profunda que le haga ver su tema desde un ángulo nuevo. Sin preámbulos. Máximo 3 líneas.`

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
  if (mode === 'titulos') {
    const mockTitulos = [
      { titulo: `7 razones por las que tu audiencia necesita leer sobre ${niche} ahora`, tipo: 'numeros', porque: 'Los números generan expectativa concreta' },
      { titulo: `¿Por qué el 90% falla en ${niche}? (y cómo no ser parte de esa estadística)`, tipo: 'pregunta', porque: 'La pregunta retórica crea identificación inmediata' },
      { titulo: `Lo que nadie te dice sobre ${niche} — y por qué importa`, tipo: 'contraste', porque: 'El secreto implícito activa la curiosidad' },
      { titulo: `Cómo dominar ${niche} en 30 días sin experiencia previa`, tipo: 'promesa', porque: 'Beneficio claro + accesibilidad elimina fricción' },
      { titulo: `El error más costoso en ${niche} (que cometes sin saberlo)`, tipo: 'dolor', porque: 'El miedo a perder motiva más que ganar' },
      { titulo: `${niche.charAt(0).toUpperCase() + niche.slice(1)}: la guía definitiva para empezar hoy`, tipo: 'beneficio', porque: 'Autoridad + inmediatez = acción' },
      { titulo: `Caso real: de 0 a resultados en ${niche} en 3 meses`, tipo: 'historia', porque: 'Los casos reales generan credibilidad automática' },
      { titulo: `La estrategia de ${niche} que los expertos no comparten`, tipo: 'curiosidad', porque: 'El conocimiento exclusivo dispara el FOMO' },
      { titulo: `${niche} en 2025: lo que funciona y lo que ya murió`, tipo: 'tendencias', porque: 'La actualidad genera urgencia de lectura' },
      { titulo: `Por qué deberías replantear todo lo que sabes sobre ${niche}`, tipo: 'contraste', porque: 'Desafiar creencias crea disonancia cognitiva positiva' },
    ]
    return { text: JSON.stringify(mockTitulos), demo: true }
  }
  if (mode === 'hooks') {
    const mockHooks = [
      { tipo: 'historia', texto: `Hace 3 años, estaba exactamente donde tú estás ahora. Sin resultados, sin claridad, sin un sistema. Hoy te voy a contar qué cambió todo.` },
      { tipo: 'estadistica', texto: `El 87% de los blogs que empiezan este año estarán abandonados en 6 meses. No porque sus creadores no tengan talento — sino porque nadie les enseñó el sistema correcto.` },
      { tipo: 'pregunta', texto: `¿Qué pasaría si pudieras eliminar el 80% de tu trabajo y obtener el doble de resultados? No es una promesa vacía — es exactamente lo que vas a aprender aquí.` },
      { tipo: 'dolor', texto: `Publicar sin resultados duele. Dedicar horas a un artículo que nadie lee es frustrante. Pero el problema no eres tú — es el enfoque. Y eso tiene solución.` },
      { tipo: 'controversia', texto: `Voy a decirte algo que la mayoría de los expertos nunca admitirá: el consejo estándar sobre blogs está desactualizado. Aquí está la verdad.` },
    ]
    return { text: JSON.stringify(mockHooks), demo: true }
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

async function callClaude(prompt: string, apiKey: string, temperature: number): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model:      MODEL,
    max_tokens: 2000,
    system:     SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  })
  void temperature // Claude SDK no expone temperature en esta versión — usamos el default
  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  return cleanResponse(text)
}

async function callGroq(prompt: string, apiKey: string, temperature: number): Promise<string> {
  const GROQ_MODEL = 'llama-3.3-70b-versatile' // Actualizado: modelo 2025
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.choices?.[0]?.message?.content || '')
}

async function callGemini(prompt: string, apiKey: string, temperature: number): Promise<string> {
  const GEMINI_MODEL = 'gemini-2.0-flash-exp' // Actualizado: Gemini 2.0 gratis
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2000, temperature },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

// ── Handler ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body    = await req.json()
  const { messages, mode, profile } = body
  const lastMsg = messages?.[messages.length - 1]?.content || ''
  const temperature = getTemperature(mode || 'default')

  // 1️⃣ API key explícita del usuario (enviada desde /configuracion)
  const userKey = req.headers.get('x-anthropic-key') || ''
  if (userKey && userKey.startsWith('sk-')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callClaude(prompt, userKey, temperature)
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
      const text   = await callClaude(prompt, serverKey, temperature)
      return NextResponse.json({ text, model: MODEL })
    } catch (e) {
      console.error('[BlogOS] Server key error:', e)
    }
  }

  // 3️⃣ Groq API — ultra-rápida, tier gratuito (console.groq.com)
  const userGroqKey   = req.headers.get('x-groq-key') || ''
  const serverGroqKey = process.env.GROQ_API_KEY || ''
  const groqKey       = userGroqKey || serverGroqKey
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callGroq(prompt, groqKey, temperature)
      return NextResponse.json({ text, model: 'groq/llama-3.3-70b' })
    } catch (e) {
      console.error('[BlogOS] Groq error:', e)
    }
  }

  // 4️⃣ Gemini API — gratuito (aistudio.google.com)
  const userGemKey   = req.headers.get('x-gemini-key') || ''
  const serverGemKey = process.env.GEMINI_API_KEY || ''
  const gemKey       = userGemKey || serverGemKey
  if (gemKey) {
    try {
      const prompt = buildPrompt(mode, lastMsg, profile)
      const text   = await callGemini(prompt, gemKey, temperature)
      return NextResponse.json({ text, model: 'gemini/2.0-flash' })
    } catch (e) {
      console.error('[BlogOS] Gemini error:', e)
    }
  }

  // 5️⃣ Proxy al servidor local con OAuth (tunnel de Cloudflare)
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

  // 6️⃣ Claude CLI con OAuth (solo disponible en servidor local)
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

  // 7️⃣ Mock inteligente — siempre funciona, nunca muestra errores
  return NextResponse.json(getFallback(mode, lastMsg, profile))
}
