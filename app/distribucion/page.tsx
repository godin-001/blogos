'use client'

import { useState } from 'react'
import { Share2, Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import { callChat, getStoredKeys, getProfile } from '@/lib/api'

const FORMATOS = [
  { id: 'twitter_thread', icon: '🐦', platform: 'Twitter/X', label: 'Thread viral', color: '#1d9bf0', desc: '10 tweets que resumen el artículo como una historia' },
  { id: 'linkedin', icon: '💼', platform: 'LinkedIn', label: 'Post profesional', color: '#0a66c2', desc: 'Reflexión de valor para tu red profesional' },
  { id: 'instagram_carousel', icon: '📸', platform: 'Instagram', label: 'Carrusel', color: '#e1306c', desc: '7 slides con los insights más visuales del artículo' },
  { id: 'email', icon: '📧', platform: 'Newsletter', label: 'Email a suscriptores', color: '#f59e0b', desc: 'Versión personalizada con CTA para leer el artículo completo' },
  { id: 'tiktok_guion', icon: '🎵', platform: 'TikTok / Reels', label: 'Guión de video', color: '#ff0050', desc: 'Guión de 60 segundos para video corto' },
  { id: 'podcast_outline', icon: '🎙️', platform: 'Podcast', label: 'Guión de episodio', color: '#8b5cf6', desc: 'Estructura para un episodio de 10-15 min' },
  { id: 'whatsapp_push', icon: '📱', platform: 'WhatsApp / Telegram', label: 'Mensaje de push', color: '#25d366', desc: 'Mensaje corto para comunidades y grupos' },
]

interface FormatoResult {
  id: string
  contenido: string
  tip: string
  hashtags?: string
}

export default function DistribucionPage() {
  const [titulo, setTitulo] = useState('')
  const [resumen, setResumen] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [formatos, setFormatos] = useState<FormatoResult[]>([])
  const [activeFormat, setActiveFormat] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>(FORMATOS.map(f => f.id))

  function toggleFormat(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function generar() {
    if (!titulo.trim()) return
    setLoading(true)
    setFormatos([])

    const profile = getProfile()
    const keys = getStoredKeys()
    const selectedFmts = FORMATOS.filter(f => selected.includes(f.id))

    const prompt = `Eres un estratega de distribución de contenido multicanal de clase mundial. 
    
Convierte este artículo en ${selectedFmts.length} formatos nativos para cada plataforma.

ARTÍCULO:
Título: ${titulo}
Resumen: ${resumen || 'No proporcionado — usa el título como referencia'}
URL: ${url || '[URL del artículo]'}
Nicho: ${profile?.niche || 'Marketing digital'}
Audiencia: ${profile?.audience || 'emprendedores LATAM'}

FORMATOS A GENERAR:
${selectedFmts.map(f => `- ${f.id}: ${f.label} para ${f.platform} — ${f.desc}`).join('\n')}

Reglas CRÍTICAS:
- Cada formato debe ser NATIVO a esa plataforma (no copies el mismo texto)
- Tono conversacional, español LATAM, sin anglicismos innecesarios
- Twitter: máx 10 tweets, cada uno claramente numerado con emoji
- LinkedIn: empezar con una sola oración poderosa (sin "Hoy quiero compartir...")
- Instagram: slide por slide separados con "--- SLIDE X ---"
- Email: con asunto, preview text y cuerpo
- TikTok: con ganchos para camara, cortes y CTA final
- Podcast: con introducción, 3-4 secciones y conclusión
- WhatsApp: máx 3 párrafos cortos + link

Responde SOLO en JSON:
[
  {
    "id": "id del formato",
    "contenido": "el contenido completo listo para publicar",
    "tip": "tip estratégico de publicación en 1 línea",
    "hashtags": "hasta 5 hashtags relevantes (solo si aplica)"
  }
]`

    try {
      const res = await callChat([{ role: 'user', content: prompt }], keys.anthropic)
      const json = JSON.parse(res.match(/\[[\s\S]*\]/)?.[0] || '[]')
      if (json.length > 0) {
        setFormatos(json)
        setActiveFormat(json[0]?.id || null)
      }
    } catch {
      // Mock fallback
      const mockFormatos: FormatoResult[] = selectedFmts.map(f => ({
        id: f.id,
        contenido: getMockContent(f.id, titulo, url),
        tip: getMockTip(f.id),
        hashtags: getMockHashtags(f.id),
      }))
      setFormatos(mockFormatos)
      setActiveFormat(mockFormatos[0]?.id || null)
    } finally {
      setLoading(false)
    }
  }

  function getMockContent(id: string, titulo: string, url: string): string {
    const u = url || '[URL de tu artículo]'
    const mocks: Record<string, string> = {
      twitter_thread: `🧵 Llevo 3 años haciendo ${titulo.toLowerCase()}. Aquí todo lo que aprendí (hilo):\n\n1/ La mayoría lo hace al revés. Te explico por qué.\n\n2/ El error más común es empezar por el final. Lo que funciona es...\n\n3/ Herramienta que cambió todo para mí: [herramienta]\n\n4/ El framework que uso cada semana:\n→ Paso 1: Define el objetivo\n→ Paso 2: Identifica a tu lector ideal\n→ Paso 3: Crea el gancho primero\n\n5/ Resultado después de aplicar esto: +200% de tráfico orgánico en 90 días\n\n6/ Si quieres el análisis completo con ejemplos reales:\n${u}\n\nRTea el tweet 1 si esto te fue útil 🙌`,
      linkedin: `Cometí el mismo error durante 2 años seguidos.\n\nPublicaba artículos de 2000 palabras que nadie leía.\nEscribía sobre ${titulo.toLowerCase()}.\nTenía el SEO "correcto".\nPero el tráfico no llegaba.\n\nHasta que entendí esto: el problema no era el contenido.\nEra la estructura de distribución.\n\nLo que cambió todo:\n→ Primero crea el contenido en una plataforma\n→ Luego adáptalo a otras 3-4 plataformas\n→ Usa cada red para su intención real\n\nDetalles completos en mi nuevo artículo:\n${u}\n\n¿Cuál es el canal que más te ha funcionado para distribuir contenido?`,
      instagram_carousel: `--- SLIDE 1 ---\n🎯 ${titulo}\n[Subtítulo que promete el resultado]\n\n--- SLIDE 2 ---\nEl problema real:\n❌ Publicas y nadie lee\n❌ No sabes dónde compartir\n❌ Sientes que pierdes el tiempo\n\n--- SLIDE 3 ---\nLa solución en 3 pasos:\n1. Define TU red principal\n2. Adapta el formato (no copies)\n3. Publica con consistencia\n\n--- SLIDE 4 ---\nEjemplo real:\n[Captura o dato visual impactante del artículo]\n\n--- SLIDE 5 ---\n¿El resultado?\n📈 Más tráfico\n📩 Más suscriptores\n💰 Más conversiones\n\n--- SLIDE 6 ---\nGuarda este carrusel 📌\nEl artículo completo en el link de la bio →\n${u}`,
      email: `Asunto: Cómo hacer ${titulo.toLowerCase()} (y por qué casi nadie lo hace bien)\nPreview: Este artículo cambió la forma en que pienso sobre el tema...\n\n---\n\nHola [Nombre],\n\nEsta semana estuve obsesionado con una pregunta:\n¿Por qué algunos bloggers dominan su nicho y otros publican sin resultados?\n\nLa respuesta no tiene que ver con el talento.\nTiene que ver con el sistema.\n\nEscribí un artículo completo donde explico exactamente:\n• Por qué la mayoría falla en este punto\n• El framework de 3 pasos que sí funciona\n• Ejemplos reales con números\n\n→ Léelo aquí: ${u}\n\nQuedo pendiente de tus comentarios.\n\n[Tu nombre]`,
      tiktok_guion: `[GANCHO — 0-3 segundos]\n"El 90% de los bloggers ignora esto y por eso no crecen"\n[Apuntar a la cámara con expresión de revelación]\n\n[DESARROLLO — 3-30 segundos]\n"Te voy a explicar ${titulo.toLowerCase()} en 60 segundos"\n[Mostrar pantalla o texto en pantalla]\n→ Punto 1: [el dato más impactante del artículo]\n→ Punto 2: [el error más común]\n→ Punto 3: [la solución concreta]\n\n[CIERRE — 30-60 segundos]\n"Esto me tomó 2 años aprenderlo. A ti te tomó 60 segundos."\n"Comenta '📝' si quieres el artículo completo con todos los detalles"\n[Texto en pantalla: Link en bio ↑]`,
      podcast_outline: `EPISODIO: ${titulo}\nDuración estimada: 12-15 minutos\n\n[INTRO — 1 min]\n"Hoy vamos a hablar de algo que muy pocos creadores de contenido hacen bien..."\nAnticipa el valor: "Al final vas a tener [resultado específico]"\n\n[HISTORIA — 2 min]\nComparte una anécdota personal relacionada con el tema\n\n[SECCIÓN 1 — 3 min]\nEl problema real: por qué esto importa ahora\n\n[SECCIÓN 2 — 4 min]\nEl framework: los 3 pasos clave\nEjemplo real con números\n\n[SECCIÓN 3 — 2 min]\nCómo implementarlo esta semana\nRecursos y herramientas recomendadas\n\n[OUTRO — 2 min]\nResumen de los 3 puntos clave\nCTA: "Encuentra el artículo completo en [URL]"\nSuscripción y review`,
      whatsapp_push: `📝 *${titulo}*\n\nAcabo de publicar un artículo que creo que te va a servir mucho si estás trabajando en hacer crecer tu blog.\n\nEl punto más importante: [insight clave del artículo en 1 oración]\n\nLéelo aquí 👇\n${u}`,
    }
    return mocks[id] || `Contenido para ${id} sobre "${titulo}"\n\nURL: ${u}`
  }

  function getMockTip(id: string): string {
    const tips: Record<string, string> = {
      twitter_thread: 'Publica el hilo en tu hora de mayor engagement (revisa tus analytics). Responde cada comentario en las primeras 2 horas para amplificar el alcance',
      linkedin: 'Publica martes a jueves entre 8-10 AM hora de tu audiencia. Responde todos los comentarios en la primera hora',
      instagram_carousel: 'Los carruseles tienen el mayor engagement orgánico en IG. Primer slide = decisión de swipe. Hazlo irresistible',
      email: 'Mejor día: martes o jueves. Mejor hora: 8-9 AM o 4-5 PM. Asunto con número o pregunta = +20% apertura',
      tiktok_guion: 'Los primeros 3 segundos son todo. Graba en vertical. Añade captions para quienes ven sin audio (70% del tráfico)',
      podcast_outline: 'Menciona el episodio en Twitter, LinkedIn y email el día que publicas. La primera hora de distribución define el alcance',
      whatsapp_push: 'Envía a tus grupos más activos. No uses broadcast si tienes baja apertura — es mejor 1a1 selectivo',
    }
    return tips[id] || 'Publica en las horas de mayor actividad de tu audiencia'
  }

  function getMockHashtags(id: string): string {
    const tags: Record<string, string> = {
      twitter_thread: '#BloggingTips #ContentCreator #Marketing',
      linkedin: '#Emprendimiento #Marketing #ContentCreator',
      instagram_carousel: '#BloggingCommunity #CreadorDeContenido #Marketing',
      tiktok_guion: '#bloggingtips #marketingdigital #emprendedor',
    }
    return tags[id] || ''
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeResult = formatos.find(f => f.id === activeFormat)
  const activeFmt = FORMATOS.find(f => f.id === activeFormat)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Share2 size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Distribución Omnicanal</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>1 artículo → 7 formatos nativos listos para publicar</p>
          </div>
        </div>
      </div>

      {/* Format selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
          SELECCIONA LOS CANALES <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({selected.length} seleccionados)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
          {FORMATOS.map(f => (
            <button
              key={f.id}
              onClick={() => toggleFormat(f.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: selected.includes(f.id) ? f.color : 'var(--border)',
                background: selected.includes(f.id) ? `${f.color}12` : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                opacity: selected.includes(f.id) ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>{f.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: selected.includes(f.id) ? f.color : 'var(--text-muted)' }}>
                {f.platform}
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="input"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Título del artículo *"
          />
          <textarea
            className="textarea"
            value={resumen}
            onChange={e => setResumen(e.target.value)}
            placeholder="Resumen del artículo o puntos principales (opcional, mejora la calidad)"
            rows={3}
          />
          <input
            className="input"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL del artículo (ej: https://tublog.com/mi-articulo)"
          />

          <button
            className="btn btn-primary"
            onClick={generar}
            disabled={loading || !titulo.trim() || selected.length === 0}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Generando formatos...</> : `📡 Generar ${selected.length} formatos`}
          </button>
        </div>
      </div>

      {/* Results */}
      {formatos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
          {/* Platform tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formatos.map(f => {
              const fmt = FORMATOS.find(x => x.id === f.id)
              if (!fmt) return null
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFormat(f.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: activeFormat === f.id ? fmt.color : 'var(--border)',
                    background: activeFormat === f.id ? `${fmt.color}15` : 'var(--bg-card)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 18 }}>{fmt.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: activeFormat === f.id ? fmt.color : 'var(--text)', marginTop: 2 }}>
                    {fmt.platform}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Content panel */}
          {activeResult && activeFmt && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{activeFmt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{activeFmt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeFmt.platform}</div>
                  </div>
                </div>
                <button
                  onClick={() => copiar(activeResult.contenido, activeFormat!)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, padding: '6px 12px', borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: copied === activeFormat ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: copied === activeFormat ? '#10b981' : 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  {copied === activeFormat ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar todo</>}
                </button>
              </div>

              <pre style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.8,
                background: 'rgba(0,0,0,0.15)', borderRadius: 10,
                padding: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'inherit', marginBottom: 16,
                maxHeight: 400, overflowY: 'auto',
              }}>
                {activeResult.contenido}
              </pre>

              {/* Tip */}
              <div style={{
                padding: '10px 14px',
                background: `${activeFmt.color}10`,
                borderRadius: 8,
                border: `1px solid ${activeFmt.color}25`,
                marginBottom: activeResult.hashtags ? 10 : 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: activeFmt.color }}>⚡ Tip estratégico:</span>
                <span style={{ fontSize: 12, color: 'var(--text)', marginLeft: 6 }}>{activeResult.tip}</span>
              </div>

              {activeResult.hashtags && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeResult.hashtags.split(' ').map((h, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 6,
                      background: `${activeFmt.color}15`, color: activeFmt.color
                    }}>{h}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
