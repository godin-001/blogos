'use client'

import { useState } from 'react'
import { Share2, Loader2, Copy, Check } from 'lucide-react'
import { callChat, getProfile } from '@/lib/api'

const FORMATOS = [
  { id: 'twitter',  icon: '🐦', platform: 'Twitter/X',         label: 'Thread viral',        color: '#1d9bf0', desc: '10 tweets que cuentan el artículo como historia' },
  { id: 'linkedin', icon: '💼', platform: 'LinkedIn',           label: 'Post profesional',    color: '#0a66c2', desc: 'Reflexión de valor para tu red profesional' },
  { id: 'ig',       icon: '📸', platform: 'Instagram',          label: 'Carrusel',            color: '#e1306c', desc: '7 slides con los insights más visuales' },
  { id: 'email',    icon: '📧', platform: 'Newsletter',         label: 'Email a suscriptores',color: '#f59e0b', desc: 'Versión personalizada con CTA para leer el artículo' },
  { id: 'tiktok',   icon: '🎵', platform: 'TikTok / Reels',    label: 'Guión de video',      color: '#ff0050', desc: 'Guión de 60 segundos para video corto' },
  { id: 'podcast',  icon: '🎙️', platform: 'Podcast',            label: 'Guión de episodio',   color: '#8b5cf6', desc: 'Estructura para un episodio de 10-15 min' },
  { id: 'whatsapp', icon: '📱', platform: 'WhatsApp / Telegram',label: 'Mensaje push',        color: '#25d366', desc: 'Mensaje corto para comunidades y grupos' },
]

interface FormatoResult { id: string; contenido: string; tip: string; hashtags?: string }

function mockContent(id: string, titulo: string, url: string): FormatoResult {
  const u = url || '[URL de tu artículo]'
  const map: Record<string, { contenido: string; tip: string; hashtags?: string }> = {
    twitter: {
      contenido: `🧵 Todo lo que aprendí sobre "${titulo}" (hilo):\n\n1/ La mayoría lo hace al revés. Te explico por qué.\n\n2/ El error más común es empezar por el final. Lo que funciona es...\n\n3/ El framework que uso:\n→ Paso 1: Define el objetivo\n→ Paso 2: Identifica a tu lector\n→ Paso 3: Crea el gancho primero\n\n4/ Resultado: +200% tráfico orgánico en 90 días\n\n5/ Artículo completo aquí:\n${u}\n\nRTea si esto te fue útil 🙌`,
      tip: 'Publica en tu hora de mayor engagement. Responde cada comentario en las primeras 2 horas para amplificar el alcance.',
      hashtags: '#BloggingTips #ContentCreator #Marketing',
    },
    linkedin: {
      contenido: `Cometí el mismo error durante 2 años.\n\nPublicaba artículos que nadie leía.\nTenía el SEO "correcto".\nPero el tráfico no llegaba.\n\nHasta que entendí: el problema no era el contenido. Era la distribución.\n\nSobre ${titulo}:\n→ Lo que la mayoría ignora\n→ El cambio que lo transforma\n→ Cómo implementarlo esta semana\n\nArtículo completo:\n${u}\n\n¿Cuál es el canal que más te ha funcionado?`,
      tip: 'Publica martes-jueves 8-10 AM. Responde todos los comentarios en la primera hora para impulsar el alcance.',
    },
    ig: {
      contenido: `--- SLIDE 1 ---\n🎯 ${titulo}\n[Subtítulo con el resultado prometido]\n\n--- SLIDE 2 ---\nEl problema:\n❌ Publicas y nadie lee\n❌ No sabes dónde compartir\n❌ Sientes que pierdes el tiempo\n\n--- SLIDE 3 ---\nLa solución en 3 pasos:\n1️⃣ Define tu canal principal\n2️⃣ Adapta el formato (no copies)\n3️⃣ Publica con consistencia\n\n--- SLIDE 4 ---\nEjemplo real con números:\n📈 De 500 a 5,000 visitas/mes\n🕐 En solo 90 días\n\n--- SLIDE 5 ---\nResultados:\n✅ Más tráfico orgánico\n✅ Más suscriptores\n✅ Más conversiones\n\n--- SLIDE 6 ---\nGuarda este carrusel 📌\nLink completo en bio → ${u}`,
      tip: 'Los carruseles tienen el mayor engagement orgánico en IG. El primer slide decide si alguien desliza — hazlo irresistible.',
      hashtags: '#BloggingCommunity #CreadorDeContenido #Marketing',
    },
    email: {
      contenido: `Asunto: Cómo hacer ${titulo.toLowerCase()} (y por qué casi nadie lo hace bien)\nPreview: Este artículo cambió la forma en que pienso sobre el tema...\n\n---\n\nHola [Nombre],\n\nEsta semana estuve obsesionado con una pregunta:\n¿Por qué algunos bloggers dominan su nicho y otros publican sin resultados?\n\nLa respuesta no tiene que ver con el talento. Tiene que ver con el sistema.\n\nEscribí un artículo donde explico:\n• Por qué la mayoría falla en este punto\n• El framework que sí funciona\n• Ejemplos reales con números\n\n→ Léelo aquí: ${u}\n\n[Tu nombre]`,
      tip: 'Mejor día: martes o jueves. Mejor hora: 8-9 AM o 4-5 PM. Un asunto con número o pregunta = +20% apertura.',
    },
    tiktok: {
      contenido: `[GANCHO — 0-3 seg]\n"El 90% de bloggers ignora esto y por eso no crecen"\n[Apuntar a cámara, expresión de revelación]\n\n[DESARROLLO — 3-45 seg]\n"Sobre ${titulo} en 60 segundos:"\n→ Dato más impactante del artículo\n→ Error más común (muéstralo en pantalla)\n→ La solución en 1 oración\n\n[CIERRE — 45-60 seg]\n"Esto me tomó 2 años aprenderlo. A ti 60 segundos."\n"Comenta '📝' si quieres el artículo completo"\n[Texto: Link en bio ↑]`,
      tip: 'Los primeros 3 segundos son todo. Añade captions — el 70% del tráfico ve sin audio.',
      hashtags: '#bloggingtips #marketingdigital #emprendedor',
    },
    podcast: {
      contenido: `EPISODIO: ${titulo}\nDuración: 12-15 minutos\n\n[INTRO — 1 min]\n"Hoy vamos a hablar de algo que muy pocos creadores hacen bien..."\nAnticipa el valor: "Al final tendrás [resultado específico]"\n\n[HISTORIA — 2 min]\nAnécdota personal relacionada con el tema\n\n[SECCIÓN 1 — 3 min]\nEl problema real y por qué importa ahora\n\n[SECCIÓN 2 — 4 min]\nEl framework: los 3 pasos clave\nEjemplo real con números\n\n[SECCIÓN 3 — 2 min]\nCómo implementarlo esta semana\nHerramientas recomendadas\n\n[OUTRO — 2 min]\nResumen de los 3 puntos clave\nCTA: "Artículo completo en ${u}"\nSolicitar suscripción y review`,
      tip: 'Menciona el episodio en Twitter, LinkedIn y email el día de publicación. La primera hora define el alcance.',
    },
    whatsapp: {
      contenido: `📝 *${titulo}*\n\nAcabo de publicar algo que creo que te va a servir mucho si estás trabajando en hacer crecer tu blog.\n\nEl punto más importante: [el insight clave en 1 oración]\n\nLéelo aquí 👇\n${u}`,
      tip: 'Envía a tus grupos más activos. Mejor resultado 1a1 selectivo que broadcast masivo.',
    },
  }
  const m = map[id] || { contenido: `Contenido para ${id} sobre "${titulo}"\n${u}`, tip: 'Publica en horario de mayor actividad' }
  return { id, ...m }
}

export default function DistribucionPage() {
  const [titulo, setTitulo]     = useState('')
  const [resumen, setResumen]   = useState('')
  const [url, setUrl]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [formatos, setFormatos] = useState<FormatoResult[]>([])
  const [active, setActive]     = useState<string | null>(null)
  const [copied, setCopied]     = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>(FORMATOS.map(f => f.id))

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])
  }

  async function generar() {
    if (!titulo.trim()) return
    setLoading(true)
    setFormatos([])
    const profile   = getProfile()
    const selFmts   = FORMATOS.filter(f => selected.includes(f.id))

    const promptText = `Eres un estratega de contenido multicanal. Convierte este artículo en ${selFmts.length} formatos nativos.

ARTÍCULO:
Título: ${titulo}
Resumen: ${resumen || 'No proporcionado'}
URL: ${url || '[URL del artículo]'}
Nicho: ${profile?.niche || 'Marketing digital'}
Audiencia: ${profile?.audience || 'emprendedores LATAM'}

FORMATOS:
${selFmts.map(f => `- ${f.id}: ${f.label} para ${f.platform} — ${f.desc}`).join('\n')}

Reglas:
- Cada formato NATIVO a esa plataforma (no copies el mismo texto)
- Español LATAM conversacional
- Twitter: 8-10 tweets numerados
- LinkedIn: primera oración poderosa, sin "Hoy quiero compartir..."
- Instagram: slide por slide con "--- SLIDE N ---"
- Email: con asunto, preview text y cuerpo
- TikTok: con marcas de tiempo y acciones de cámara
- Podcast: estructura de episodio completa
- WhatsApp: máx 3 párrafos + link

Responde SOLO en JSON sin markdown:
[{"id":"","contenido":"","tip":"tip estratégico en 1 línea","hashtags":"hasta 5 hashtags (solo si aplica)"}]`

    try {
      const res   = await callChat({ messages: [{ role: 'user', content: promptText }], profile })
      const raw   = (res as { text?: string }).text || ''
      const match = raw.match(/\[[\s\S]*\]/)
      const json  = match ? JSON.parse(match[0]) : null
      if (Array.isArray(json) && json.length > 0) {
        setFormatos(json)
        setActive(json[0]?.id || null)
        return
      }
      throw new Error('bad json')
    } catch {
      const mocks = selFmts.map(f => mockContent(f.id, titulo, url))
      setFormatos(mocks)
      setActive(mocks[0]?.id || null)
    } finally {
      setLoading(false)
    }
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const activeResult = formatos.find(f => f.id === active)
  const activeFmt    = FORMATOS.find(f => f.id === active)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Share2 size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Distribución Omnicanal</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>1 artículo → 7 formatos nativos listos para publicar</p>
          </div>
        </div>
      </div>

      {/* Input + channel selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          CANALES <span style={{ fontWeight: 400 }}>({selected.length} seleccionados)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 16 }}>
          {FORMATOS.map(f => (
            <button key={f.id} onClick={() => toggle(f.id)} style={{
              padding: '8px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer', textAlign: 'left',
              borderColor: selected.includes(f.id) ? f.color : 'var(--border)',
              background: selected.includes(f.id) ? `${f.color}12` : 'transparent',
              opacity: selected.includes(f.id) ? 1 : 0.45,
            }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{f.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: selected.includes(f.id) ? f.color : 'var(--text-muted)' }}>{f.platform}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Título del artículo *" />
          <textarea className="textarea" value={resumen} onChange={e => setResumen(e.target.value)}
            placeholder="Resumen o puntos principales (opcional — mejora la calidad)" rows={3} />
          <input className="input" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="URL del artículo (ej: https://tublog.com/articulo)" />
          <button className="btn btn-primary" onClick={generar}
            disabled={loading || !titulo.trim() || selected.length === 0}
            style={{ alignSelf: 'flex-start' }}>
            {loading ? <><Loader2 size={16} className="spin" /> Generando...</> : `📡 Generar ${selected.length} formatos`}
          </button>
        </div>
      </div>

      {/* Results */}
      {formatos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16 }}>
          {/* Platform tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formatos.map(f => {
              const fmt = FORMATOS.find(x => x.id === f.id)
              if (!fmt) return null
              return (
                <button key={f.id} onClick={() => setActive(f.id)} style={{
                  padding: '10px 12px', borderRadius: 10, border: '1px solid', cursor: 'pointer', textAlign: 'left',
                  borderColor: active === f.id ? fmt.color : 'var(--border)',
                  background: active === f.id ? `${fmt.color}15` : 'var(--bg-card)',
                }}>
                  <div style={{ fontSize: 18 }}>{fmt.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: active === f.id ? fmt.color : 'var(--text-muted)', marginTop: 2 }}>
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
                <button onClick={() => copiar(activeResult.contenido, active!)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
                  background: copied === active ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: copied === active ? '#10b981' : 'var(--text)',
                }}>
                  {copied === active ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar todo</>}
                </button>
              </div>

              <pre style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.8,
                background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '16px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
                marginBottom: 16, maxHeight: 400, overflowY: 'auto',
              }}>
                {activeResult.contenido}
              </pre>

              <div style={{
                padding: '10px 14px', background: `${activeFmt.color}10`,
                borderRadius: 8, border: `1px solid ${activeFmt.color}25`,
                marginBottom: activeResult.hashtags ? 10 : 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: activeFmt.color }}>⚡ Tip estratégico: </span>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{activeResult.tip}</span>
              </div>

              {activeResult.hashtags && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeResult.hashtags.split(' ').filter(Boolean).map((h, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 6,
                      background: `${activeFmt.color}15`, color: activeFmt.color,
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
