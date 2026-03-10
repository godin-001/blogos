import { NextRequest, NextResponse } from 'next/server'

// Preguntas fallback locales — profundas, ambiciosas, sin IA
const PREGUNTAS_FALLBACK = [
  { pregunta: "¿Cuál es el artículo que tienes miedo de escribir porque podría cambiarlo todo?", categoria: "valentía", accion: "Escríbelo hoy" },
  { pregunta: "Si tuvieras 100,000 lectores mañana, ¿qué es lo primero que les dirías?", categoria: "ambición", accion: "Empieza ese artículo" },
  { pregunta: "¿Estás creando el contenido que tú, hace 3 años, desesperadamente necesitabas?", categoria: "propósito", accion: "Escribe para ese tú del pasado" },
  { pregunta: "¿Cuál es la creencia sobre tu nicho que nunca has cuestionado, pero que podría estar limitándote?", categoria: "mindset", accion: "Escribe un artículo de opinión" },
  { pregunta: "¿Qué tema evitas escribir porque sientes que 'no eres suficiente experto'? Ese es exactamente el que deberías escribir.", categoria: "síndrome del impostor", accion: "Empieza con lo que ya sabes" },
  { pregunta: "Si tu blog fuera tu único ingreso en 12 meses, ¿qué publicarías esta semana?", categoria: "urgencia", accion: "Actúa como si ya fuera verdad" },
  { pregunta: "¿Hay una opinión en tu industria con la que todo el mundo está de acuerdo pero tú no? ¿Por qué no la has publicado?", categoria: "coraje", accion: "Publica esa opinión" },
  { pregunta: "¿Cuántas personas más pueden transformar su vida o negocio si escribes esa idea que llevas semanas postergando?", categoria: "impacto", accion: "Escribe por ellos" },
  { pregunta: "¿Qué sería diferente en tu vida en 2 años si publicas consistentemente 3 artículos por semana desde hoy?", categoria: "visión", accion: "Visualiza y actúa" },
  { pregunta: "¿Estás jugando en modo seguro? ¿Cuál sería tu artículo más arriesgado y honesto?", categoria: "autenticidad", accion: "Escribe sin filtros" },
  { pregunta: "¿Quién es la persona específica que necesita leer algo que solo tú puedes escribir?", categoria: "audiencia", accion: "Escribe para esa persona" },
  { pregunta: "¿En qué área de tu nicho estás 10 veces más adelantado que hace un año? Eso es un artículo.", categoria: "crecimiento", accion: "Documenta tu evolución" },
  { pregunta: "¿Cuál es el error más costoso que has cometido en tu industria? Esa historia vale más que 10 tutoriales.", categoria: "vulnerabilidad", accion: "Comparte la lección" },
  { pregunta: "¿Estás escribiendo para impresionar o para transformar? La diferencia define si tu blog crece o muere.", categoria: "propósito", accion: "Reenfoca tu próximo artículo" },
  { pregunta: "¿Cuál es el consejo que le darías a alguien que empieza en tu nicho hoy? Escríbelo. Miles lo necesitan.", categoria: "legado", accion: "Crea tu guía definitiva" },
]

const SYSTEM_PREGUNTAS = `Eres un mentor brutal y apasionado de blogging y creación de contenido.
Tu trabajo es hacer UNA sola pregunta que sacuda al escritor de su zona de confort.
La pregunta debe ser profunda, provocadora, y despertar ambición real.
Habla de tú a tú. Sin rodeos. Sin motivación vacía. Solo la verdad incómoda.`

async function generarConIA(niche: string, historial: string[], apiKey: string): Promise<{ pregunta: string; categoria: string; accion: string }> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const historialStr = historial.length
    ? `Ya has recibido estas preguntas: ${historial.join(' | ')}. No repitas temas.`
    : ''

  const prompt = `Nicho del blogger: ${niche}
${historialStr}

Genera UNA sola pregunta que:
1. Cuestione una creencia limitante común en este nicho
2. Despierte ambición real, no motivación superficial  
3. Lleve a la acción AHORA, no "algún día"
4. Sea incómoda pero verdadera

Responde SOLO con este JSON sin markdown:
{"pregunta":"...","categoria":"una_palabra","accion":"frase imperativa de máximo 6 palabras"}`

  const res = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    system: SYSTEM_PREGUNTAS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  const clean = text.replace(/^```json?\s*/m, '').replace(/```$/m, '').trim()
  return JSON.parse(clean)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { niche = 'emprendimiento', historial = [] } = body

  // Intentar con API key del usuario
  const userKey = req.headers.get('x-anthropic-key') || ''
  const serverKey = process.env.ANTHROPIC_API_KEY || ''
  const apiKey = (userKey.startsWith('sk-') ? userKey : null) || (serverKey.startsWith('sk-') ? serverKey : null)

  if (apiKey) {
    try {
      const result = await generarConIA(niche, historial, apiKey)
      return NextResponse.json({ ...result, ia: true })
    } catch (e) {
      console.error('[BlogOS] pregunta-ambiciosa error:', e)
    }
  }

  // Fallback: pregunta local aleatoria no repetida
  const disponibles = PREGUNTAS_FALLBACK.filter(p => !historial.includes(p.pregunta))
  const pool = disponibles.length > 0 ? disponibles : PREGUNTAS_FALLBACK
  const random = pool[Math.floor(Math.random() * pool.length)]
  return NextResponse.json({ ...random, ia: false })
}
