import { NextRequest, NextResponse } from 'next/server'
import {
  mockGenerateIdeas,
  mockGenerateSection,
  mockSeoAnalysis,
  mockReflexiveQuestion,
} from '@/lib/mock-ai'

// ── Modelos por complejidad ───────────────────────────────────────
const MODELS = {
  fast:    'claude-haiku-4-5',   // Rápido: hooks, estructura, títulos
  smart:   'claude-sonnet-4-5',  // Inteligente: análisis, reescritura, SEO
  default: 'claude-haiku-4-5',
}

function getModelForMode(mode: string): string {
  const fast  = ['ideas', 'hooks', 'estructura', 'titulos', 'reducir', 'social', 'cta']
  const smart = ['seo', 'reflexion', 'analizar', 'reescribir', 'expandir', 'newsletter_adapt']
  if (fast.includes(mode))  return MODELS.fast
  if (smart.includes(mode)) return MODELS.smart
  return MODELS.default
}

const PERSONA = `Eres BlogOS AI, el asistente de escritura más avanzado para bloggers hispanohablantes.
Tienes expertise en: SEO, copywriting de conversión, storytelling, estructuras narrativas, marketing de contenidos y psicología del lector.
Eres directo, preciso y orientado a resultados. Nunca rellenas con frases vacías. Cada palabra que escribes aporta valor.`

function cleanResponse(text: string): string {
  return text
    .replace(/^```(?:json|markdown|md)?\s*/gm, '')
    .replace(/\s*```$/gm, '')
    .trim()
}

// ── Prompts ultra-potentes por modo ──────────────────────────────
function buildPrompt(mode: string, lastMsg: string, profile: Record<string, string> | null): string {
  const niche    = profile?.niche    || 'marketing digital'
  const audience = profile?.audience || 'emprendedores'
  const style    = profile?.style    || 'profesional y cercano'
  const ctx      = `BLOGGER: Nicho="${niche}" | Audiencia="${audience}" | Estilo="${style}"`

  switch (mode) {

    case 'titulos':
      return `${PERSONA}\n${ctx}\n\nTema/artículo: "${lastMsg}"

Genera 10 títulos de blog de alto impacto. Usa DIFERENTES fórmulas para cada uno:
1. Número + beneficio + tiempo ("5 estrategias que... en 30 días")
2. Pregunta provocadora
3. Contraintuitivo/Contrarian
4. El secreto/Lo que nadie dice
5. Cómo + resultado específico
6. Por qué + afirmación fuerte
7. Error + solución
8. Promesa audaz con especificidad
9. Fear Of Missing Out (FOMO)
10. Listicle con adjetivo de poder

Responde SOLO con JSON válido, sin markdown:
[{"titulo":"...","formula":"nombre de la fórmula","por_que_funciona":"1 línea"}]`

    case 'hooks':
      return `${PERSONA}\n${ctx}\n\nArtículo/tema: "${lastMsg}"

Genera 6 ganchos iniciales DISTINTOS y poderosos. Cada uno usando un estilo diferente:
1. HISTORIA: Empieza con una micro-historia en 3 líneas con tensión real
2. DATO IMPACTANTE: Una estadística o hecho que sorprende y va contra la intuición
3. PREGUNTA INCÓMODA: La pregunta que el lector se hace pero nadie pregunta en voz alta
4. AFIRMACIÓN PROVOCADORA: Una declaración audaz que genera fricción
5. ESCENARIO FUTURO: Pinta un escenario de éxito o fracaso en 2 líneas
6. FRASE CINEMATOGRÁFICA: Un inicio con imagen mental poderosa, como primera línea de novela

Responde SOLO con JSON válido:
[{"estilo":"nombre","hook":"texto completo del gancho (2-4 oraciones)","por_que_engancha":"1 línea"}]`

    case 'expandir':
      return `${PERSONA}\n${ctx}\n\nExpande y enriquece este contenido de blog. Conviértelo en una sección profunda y valiosa.

CONTENIDO A EXPANDIR:
${lastMsg}

INSTRUCCIONES:
- Añade ejemplos concretos y específicos (no genéricos)
- Incluye al menos 1 dato o estadística relevante
- Añade profundidad con "por qué" funciona esto
- Mantén el estilo del autor: ${style}
- Longitud objetivo: 300-400 palabras
- No uses listas si el original no las usa

Devuelve SOLO el contenido expandido, sin explicaciones.`

    case 'reducir':
      return `${PERSONA}\n${ctx}\n\nCondensa este contenido manteniendo el 100% del valor.

CONTENIDO ORIGINAL:
${lastMsg}

INSTRUCCIONES:
- Conserva los insights principales y únicos
- Elimina relleno, redundancias y frases de transición vacías
- Mantén ejemplos solo si son esenciales
- Objetivo: 40-50% del largo original
- Mantén el tono y estilo: ${style}

Devuelve SOLO el contenido reducido.`

    case 'reescribir':
      return `${PERSONA}\n${ctx}\n\nReescribe este texto con una voz más potente y precisa.

TEXTO ORIGINAL:
${lastMsg}

INSTRUCCIONES:
- Usa verbos activos y fuertes (elimina verbos pasivos y débiles)
- Elimina adjetivos vacíos (muy, bastante, realmente, bastante)
- Convierte frases largas en frases cortas y directas
- Añade especificidad donde hay generalidades
- Haz que cada oración gane su lugar
- Mantén el mensaje core pero mejora la ejecución
- Tono: ${style}

Devuelve SOLO el texto reescrito.`

    case 'analizar':
      return `${PERSONA}\n${ctx}\n\nAnaliza este artículo de blog como un editor senior y estratega de contenidos.

ARTÍCULO:
${lastMsg}

Devuelve SOLO JSON válido:
{
  "puntuacion_global": 85,
  "titular_impacto": {"score":80,"feedback":"..."},
  "gancho": {"score":75,"feedback":"..."},
  "estructura": {"score":85,"feedback":"..."},
  "profundidad": {"score":80,"feedback":"..."},
  "seo_potencial": {"score":70,"feedback":"..."},
  "legibilidad": {"score":90,"feedback":"..."},
  "fortalezas": ["fortaleza 1","fortaleza 2","fortaleza 3"],
  "mejoras_urgentes": ["mejora 1 con instrucción específica","mejora 2","mejora 3"],
  "frase_clave": "La frase más poderosa del artículo (cita textual)",
  "seccion_debil": "Nombre de la sección más débil y por qué en 1 línea"
}`

    case 'social':
      return `${PERSONA}\n${ctx}\n\nAdapta este contenido para 3 redes sociales distintas.

ARTÍCULO/CONTENIDO:
${lastMsg}

Devuelve SOLO JSON válido:
{
  "twitter_thread": {
    "tweet1":"El tweet de apertura (hook potente, máx 280 chars)",
    "tweet2":"Desarrollo del punto 1",
    "tweet3":"Desarrollo del punto 2",
    "tweet4":"Desarrollo del punto 3",
    "tweet5":"Cierre + CTA (con 3 hashtags relevantes en español)"
  },
  "linkedin": {
    "apertura":"Primera línea que para el scroll (máx 150 chars, sin emojis)",
    "desarrollo":"El cuerpo del post en 3-4 párrafos cortos con saltos de línea",
    "cierre":"Pregunta de engagement para comentarios"
  },
  "instagram_caption": {
    "hook":"Primera línea ultra potente (menos de 120 chars)",
    "cuerpo":"El post completo optimizado para Instagram con emojis estratégicos",
    "hashtags":"30 hashtags relevantes en español separados por espacio"
  }
}`

    case 'newsletter_adapt':
      return `${PERSONA}\n${ctx}\n\nConvierte este artículo en un email de newsletter de alto engagement.

ARTÍCULO:
${lastMsg}

Devuelve SOLO JSON válido:
{
  "asunto_principal":"Asunto con apertura garantizada (máx 50 chars)",
  "asunto_alternativo":"Variante A/B para test",
  "preview_text":"El texto de preview que ve el lector antes de abrir (máx 90 chars)",
  "saludo":"Saludo personalizado y cálido",
  "intro":"Párrafo de introducción del newsletter (personal, no del artículo)",
  "cuerpo":"El contenido del newsletter: 3-4 párrafos concisos con los puntos clave del artículo",
  "cta_principal":"Texto del botón principal",
  "cta_url_placeholder":"[URL DEL ARTÍCULO]",
  "firma":"Cierre cálido y firma del newsletter"
}`

    case 'cta':
      return `${PERSONA}\n${ctx}\n\nGenera 8 llamados a la acción (CTAs) distintos para este artículo.

ARTÍCULO/TEMA: "${lastMsg}"

Genera CTAs para estos objetivos distintos:
1. Suscripción al newsletter
2. Compartir en redes
3. Comentar / engagement
4. Descargar recurso
5. Agendar llamada/consulta
6. Comprar/contratar
7. Leer artículo relacionado
8. Unirse a comunidad

Responde SOLO con JSON:
[{"objetivo":"nombre","cta":"Texto exacto del CTA (máx 15 palabras)","contexto":"cuándo usarlo"}]`

    case 'ideas':
      return `${PERSONA}\n${ctx}\n\n${lastMsg}

Genera exactamente 8 ideas de artículos con ALTO potencial viral y SEO.
Piensa en ideas que:
- Responden a búsquedas reales de la audiencia
- Tienen ángulo diferencial (no lo que todos publican)
- Combinan un trigger emocional con valor práctico

Responde SOLO con JSON:
[{"titulo":"...","gancho":"Primera línea del artículo (enganchante)","tipo":"educativo|inspiracional|opinion|tecnico|lista|caso-estudio","potencial":"alto|medio","keywords":["kw1","kw2","kw3"],"por_que_funcionara":"1 línea de estrategia"}]`

    case 'estructura':
      return `${PERSONA}\n${ctx}\n\n${lastMsg}

Genera el contenido solicitado. Reglas:
- Sé específico: usa ejemplos reales, no genéricos
- Cada párrafo debe aportar algo nuevo
- Sin frases de relleno ni transiciones vacías
- Tono: ${style}
- Máximo 250 palabras
Devuelve SOLO el contenido, sin explicaciones.`

    case 'seo':
      return `${PERSONA}\n${ctx}\n\n${lastMsg}

Analiza este artículo desde el punto de vista SEO y devuelve SOLO JSON válido:
{
  "score": 82,
  "keyword_principal": "la keyword que debería posicionar",
  "keywords_secundarias": ["kw2","kw3","kw4"],
  "meta_descripcion": "Meta descripción optimizada de máx 155 chars con keyword",
  "titulo_seo": "Título SEO alternativo (50-60 chars con keyword al inicio)",
  "titulos_alternativos": ["variante 1","variante 2","variante 3"],
  "fortalezas_seo": ["✓ punto 1","✓ punto 2","✓ punto 3"],
  "mejoras_seo": ["❌ problema con instrucción específica","❌ problema 2","❌ problema 3"],
  "densidad_keyword": 1.2,
  "legibilidad": "Buena",
  "longitud_recomendada": "1500-2000 palabras",
  "intension_busqueda": "informacional|transaccional|navegacional|comercial",
  "featured_snippet_oportunidad": true,
  "schema_recomendado": "Article|HowTo|FAQ|ListicleArticle"
}`

    case 'reflexion':
      return `${PERSONA}\n${ctx}\n\nEl escritor busca reflexión sobre: "${lastMsg || niche}".

Hazle UNA pregunta reflexiva y poderosa que:
- Lo haga pensar diferente sobre su trabajo o audiencia
- No tenga respuesta obvia
- Lo inspire a escribir algo que solo él puede escribir
- Conecte su experiencia personal con el valor para su audiencia

Solo la pregunta. Sin preámbulos. Máximo 2 líneas.`

    default:
      return `${PERSONA}\n${ctx}\n\n${lastMsg}`
  }
}

// ── Mock responses inteligentes ───────────────────────────────────
function getFallback(mode: string, lastMsg: string, profile: Record<string, string> | null) {
  const niche    = profile?.niche    || 'marketing digital'
  const audience = profile?.audience || ''

  if (mode === 'titulos') {
    return { text: JSON.stringify([
      { titulo: `7 estrategias de ${niche} que duplican resultados en 60 días`, formula: 'Número + beneficio + tiempo', por_que_funciona: 'Los números crean expectativa específica' },
      { titulo: `¿Por qué tu estrategia de ${niche} no está funcionando (y cómo arreglarlo)`, formula: 'Pregunta provocadora', por_que_funciona: 'Toca el dolor directo del lector' },
      { titulo: `Lo que nadie te dice sobre ${niche} en 2024`, formula: 'El secreto', por_que_funciona: 'Promete información exclusiva' },
    ]), demo: true }
  }
  if (mode === 'hooks') {
    return { text: JSON.stringify([
      { estilo: 'Historia', hook: `Hace 3 años, perdí mi mayor cliente por ignorar algo que ahora parece obvio. Esa mañana aprendí más sobre ${niche} que en los 5 años anteriores.`, por_que_engancha: 'Tensión personal inmediata' },
      { estilo: 'Dato impactante', hook: `El 92% de los artículos sobre ${niche} nunca reciben una sola visita. Este no va a ser uno de ellos.`, por_que_engancha: 'Estadística que genera miedo y curiosidad' },
    ]), demo: true }
  }
  if (mode === 'analizar') {
    return { text: JSON.stringify({
      puntuacion_global: 72,
      fortalezas: ['Estructura clara y navegable', 'Tono apropiado para la audiencia'],
      mejoras_urgentes: ['El gancho inicial no genera suficiente tensión — añade una historia personal', 'Faltan datos o estadísticas que validen los puntos', 'El CTA es genérico — hazlo específico con una razón de urgencia'],
      frase_clave: 'N/A — configura tu API para análisis completo',
      seccion_debil: 'N/A en modo demo',
    }), demo: true }
  }
  if (mode === 'social') {
    return { text: JSON.stringify({
      twitter_thread: { tweet1: `Hilo sobre ${niche} 🧵`, tweet2: 'Punto 1 del argumento', tweet3: 'Punto 2 del argumento', tweet4: 'Punto 3 con ejemplo', tweet5: `¿Qué añadirías tú? #${niche.replace(/\s/g,'')} #Marketing #Emprendimiento` },
      linkedin: { apertura: `Algo que aprendí sobre ${niche} después de 3 años...`, desarrollo: 'El contenido completo aparecerá cuando configures tu API de IA.', cierre: '¿Cuál ha sido tu mayor aprendizaje en este tema?' },
      instagram_caption: { hook: `Esto cambió mi forma de ver ${niche} 👇`, cuerpo: 'Configura tu API para generar el caption completo.', hashtags: `#${niche.replace(/\s/g,'')} #marketing #emprendimiento #negocios #contenido` },
    }), demo: true }
  }
  if (mode === 'ideas') {
    return { text: JSON.stringify(mockGenerateIdeas(niche, audience, lastMsg)), demo: true }
  }
  if (mode === 'estructura') {
    const sectionMatch = lastMsg.match(/sección a generar:\s*(\w+)/i)
    const tituloMatch  = lastMsg.match(/título:\s*(.+)/i)
    return { text: mockGenerateSection(sectionMatch?.[1] || 'gancho', tituloMatch?.[1] || '', niche), demo: true }
  }
  if (mode === 'seo') {
    const articuloMatch = lastMsg.match(/ARTÍCULO:\n([\s\S]+)$/i)
    const kwMatch       = lastMsg.match(/KEYWORD OBJETIVO:\s*"([^"]+)"/i)
    return { text: JSON.stringify(mockSeoAnalysis(articuloMatch?.[1] || '', kwMatch?.[1] || '')), demo: true }
  }
  if (mode === 'reflexion') {
    const topicMatch = lastMsg.match(/sobre:\s*"([^"]+)"/i)
    return { text: mockReflexiveQuestion(topicMatch?.[1] || niche, Math.floor(Math.random() * 10)), demo: true }
  }
  if (mode === 'expandir' || mode === 'reducir' || mode === 'reescribir') {
    return { text: lastMsg + '\n\n[Configura tu API de IA para usar esta función]', demo: true }
  }
  return { text: 'Configura tu API de IA en Configuración para respuestas completas.', demo: true }
}

// ── Proveedores de IA ─────────────────────────────────────────────

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model,
    max_tokens: 3000,
    system: PERSONA,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  return cleanResponse(text)
}

async function callClaudeStream(prompt: string, apiKey: string, model: string): Promise<ReadableStream> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const stream = client.messages.stream({
    model,
    max_tokens: 3000,
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

async function callGroq(prompt: string, apiKey: string, fast = false): Promise<string> {
  const model = fast ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile'
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(20000),
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
      generationConfig: { maxOutputTokens: 3000, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return cleanResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

async function callOpenAI(prompt: string, apiKey: string, fast = false): Promise<string> {
  const model = fast ? 'gpt-4o-mini' : 'gpt-4o'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: prompt }],
      max_tokens: 3000,
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
      model: 'mistral-large-latest',
      messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(20000),
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
  const isFast      = ['ideas', 'hooks', 'estructura', 'titulos', 'reducir', 'social', 'cta'].includes(mode || '')
  const prompt      = buildPrompt(mode || 'default', lastMsg, profile)

  // 1️⃣ Anthropic Claude — prioridad 1
  const userKey   = req.headers.get('x-anthropic-key') || ''
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  const claudeKey = (userKey || serverKey)
  if (claudeKey && claudeKey.startsWith('sk-')) {
    try {
      if (wantsStream) {
        const stream = await callClaudeStream(prompt, claudeKey, model)
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Model': model },
        })
      }
      const text = await callClaude(prompt, claudeKey, model)
      return NextResponse.json({ text, model: `claude/${model}` })
    } catch (e) { console.error('[BlogOS/Claude]', e) }
  }

  // 2️⃣ Groq — ultra-rápida, tier gratuito generoso
  const userGroqKey   = req.headers.get('x-groq-key') || ''
  const serverGroqKey = process.env.GROQ_API_KEY || ''
  const groqKey       = userGroqKey || serverGroqKey
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const text = await callGroq(prompt, groqKey, isFast)
      return NextResponse.json({ text, model: isFast ? 'groq/llama-3.1-8b-instant' : 'groq/llama-3.3-70b' })
    } catch (e) { console.error('[BlogOS/Groq]', e) }
  }

  // 3️⃣ Gemini — gratuito y potente
  const userGemKey   = req.headers.get('x-gemini-key') || ''
  const serverGemKey = process.env.GEMINI_API_KEY || ''
  const gemKey       = userGemKey || serverGemKey
  if (gemKey) {
    try {
      const text = await callGemini(prompt, gemKey)
      return NextResponse.json({ text, model: 'gemini/2.0-flash' })
    } catch (e) { console.error('[BlogOS/Gemini]', e) }
  }

  // 4️⃣ OpenAI GPT-4o
  const userOpenAIKey   = req.headers.get('x-openai-key') || ''
  const serverOpenAIKey = process.env.OPENAI_API_KEY || ''
  const openaiKey       = userOpenAIKey || serverOpenAIKey
  if (openaiKey && openaiKey.startsWith('sk-')) {
    try {
      const text = await callOpenAI(prompt, openaiKey, isFast)
      return NextResponse.json({ text, model: isFast ? 'openai/gpt-4o-mini' : 'openai/gpt-4o' })
    } catch (e) { console.error('[BlogOS/OpenAI]', e) }
  }

  // 5️⃣ Mistral — europeo, GDPR-friendly
  const userMistralKey   = req.headers.get('x-mistral-key') || ''
  const serverMistralKey = process.env.MISTRAL_API_KEY || ''
  const mistralKey       = userMistralKey || serverMistralKey
  if (mistralKey) {
    try {
      const text = await callMistral(prompt, mistralKey)
      return NextResponse.json({ text, model: 'mistral/large-latest' })
    } catch (e) { console.error('[BlogOS/Mistral]', e) }
  }

  // 6️⃣ Claude CLI con OAuth (servidor local)
  try {
    const { spawn } = await import('child_process')
    const { default: fs } = await import('fs')
    const { default: path } = await import('path')
    const { default: os } = await import('os')
    const CLAUDE_BIN = process.env.CLAUDE_CLI_PATH || '/home/devrel-frutero/.local/bin/claude'
    if (fs.existsSync(CLAUDE_BIN)) {
      const tmpFile = path.join(os.tmpdir(), `blogos-${Date.now()}.txt`)
      fs.writeFileSync(tmpFile, prompt, 'utf8')
      const cleanEnv: NodeJS.ProcessEnv = { ...process.env }
      delete cleanEnv.ANTHROPIC_API_KEY
      const text = await new Promise<string>((resolve, reject) => {
        const proc = spawn('bash', ['-c', `cat "${tmpFile}" | "${CLAUDE_BIN}" --print`], {
          timeout: 40000,
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
          else reject(new Error(`CLI ${code}: ${stderr.slice(0, 200)}`))
        })
        proc.on('error', (err: Error) => { try { fs.unlinkSync(tmpFile) } catch {}; reject(err) })
      })
      return NextResponse.json({ text, model: `${model} (oauth)` })
    }
  } catch (e) { console.error('[BlogOS/CLI]', e) }

  // 7️⃣ Mock — siempre disponible
  return NextResponse.json(getFallback(mode, lastMsg, profile))
}
