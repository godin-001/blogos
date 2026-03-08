'use client'

import { useState } from 'react'
import { Anchor, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { callChat, getProfile } from '@/lib/api'

const FORMULAS = [
  { id: 'problema',    icon: '🔥', label: 'Problema-Agitación',   desc: 'Nombra el dolor exacto y lo hace más real',                   color: '#ef4444' },
  { id: 'estadistica', icon: '📊', label: 'Estadística Impactante',desc: 'Un número que detiene el scroll en seco',                     color: '#f59e0b' },
  { id: 'historia',    icon: '🎭', label: 'Historia Personal',     desc: 'Cinemática. Hace al lector vivir la experiencia',             color: '#8b5cf6' },
  { id: 'pregunta',    icon: '❓', label: 'Pregunta Provocadora',  desc: '"Eso me pasa a mí" — abre un loop que el cerebro cierra',     color: '#06b6d4' },
  { id: 'controversia',icon: '💣', label: 'Afirmación Controversial',desc: 'Contra el sentido común. Genera reacción inmediata',        color: '#10b981' },
  { id: 'promesa',     icon: '🎯', label: 'Promesa Específica',    desc: 'El resultado exacto que el lector va a obtener',              color: '#7c3aed' },
]

interface HookResult {
  formula: string
  hook: string
  porque: string
  variante: string
}

const MOCK_HOOKS: (titulo: string) => Record<string, HookResult> = (titulo) => ({
  problema: {
    formula: 'problema', porque: 'Nombra el dolor exacto antes de que el lector lo articule',
    hook:    `Llevas meses publicando artículos que nadie lee. Revisas Analytics y el tiempo promedio en página es 23 segundos. Eso no es un problema de SEO — es un problema de la primera línea. Hoy lo vas a resolver con "${titulo}".`,
    variante:'Tu artículo tiene las keywords correctas y el título perfecto. Pero en 23 segundos, la gente se va.',
  },
  estadistica: {
    formula: 'estadistica', porque: 'Un número específico crea credibilidad instantánea y curiosidad',
    hook:    `El 73% de los lectores decide en 3 segundos si sigue leyendo o cierra la pestaña. No lo decide el título. No lo decide el SEO. Lo decide la primera oración. Aquí está cómo ganar esa batalla con "${titulo}".`,
    variante:'3 segundos. Eso es todo lo que tienes para convencer a alguien de seguir leyendo.',
  },
  historia: {
    formula: 'historia', porque: 'La narrativa personal activa empatía y hace que el lector se vea reflejado',
    hook:    `Eran las 2 AM. Tenía el cursor parpadeando en una pantalla en blanco. Había escrito y borrado la misma introducción cinco veces. Hasta que entendí algo sobre "${titulo}" que cambió todo.`,
    variante:'5 intentos. Borré y reescribí la introducción 5 veces hasta que entendí cuál era el error real.',
  },
  pregunta: {
    formula: 'pregunta', porque: 'Las preguntas abren loops cognitivos que el cerebro necesita cerrar',
    hook:    `¿Por qué los artículos mejor posicionados en Google también son los que más retienen al lector? La respuesta tiene que ver con "${titulo}" — y la mayoría lo está haciendo al revés.`,
    variante:'¿Y si el problema no es tu contenido, sino las primeras 3 oraciones?',
  },
  controversia: {
    formula: 'controversia', porque: 'Ir contra el sentido común genera disonancia cognitiva que obliga a seguir leyendo',
    hook:    `Todo lo que te enseñaron sobre "${titulo}" está mal. Los gurús te dicen que hagas X. Funciona lo opuesto. Después de analizar 50 casos, el patrón es claro — y va contra el sentido común.`,
    variante:'Te han enseñado la estrategia equivocada. Y está costándote la mitad de tus lectores.',
  },
  promesa: {
    formula: 'promesa', porque: 'La promesa específica con resultado activa el instinto de reciprocidad',
    hook:    `En los próximos 5 minutos vas a aprender exactamente qué escribir en tu primera oración para que el 80% de tus lectores lleguen hasta el final de "${titulo}" — sin cambiar el tema, sin reescribir todo.`,
    variante:'Una sola técnica. Un cambio en la primera oración. Y tus artículos se vuelven imposibles de cerrar.',
  },
})

export default function HooksPage() {
  const [titulo, setTitulo]           = useState('')
  const [audiencia, setAudiencia]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [hooks, setHooks]             = useState<HookResult[]>([])
  const [copied, setCopied]           = useState<string | null>(null)
  const [selectedFormula, setSelected] = useState<string | null>(null)

  async function generar() {
    if (!titulo.trim()) return
    setLoading(true)
    setHooks([])
    const profile  = getProfile()
    const aud      = audiencia || profile?.audience || 'emprendedores LATAM'
    const formulas = selectedFormula ? FORMULAS.filter(f => f.id === selectedFormula) : FORMULAS

    const promptText = `Eres el mejor copywriter de LATAM. Escribe hooks irresistibles para este artículo.
ARTÍCULO: "${titulo}"
AUDIENCIA: ${aud}

Genera ${formulas.length} hooks con estas fórmulas:
${formulas.map(f => `- ${f.id}: ${f.label} — ${f.desc}`).join('\n')}

Reglas:
- Máximo 3-4 oraciones por hook
- Lenguaje conversacional español LATAM
- Sin "En este artículo te voy a..."
- Cada hook diferente en tono y enfoque

Responde SOLO en JSON sin markdown:
[{"formula":"id","hook":"texto completo listo para publicar","porque":"por qué funciona psicológicamente (1 línea)","variante":"versión más corta 1-2 oraciones"}]`

    try {
      const res  = await callChat({ messages: [{ role: 'user', content: promptText }], profile })
      const raw  = (res as { text?: string }).text || ''
      const match = raw.match(/\[[\s\S]*\]/)
      const json  = match ? JSON.parse(match[0]) : null
      if (Array.isArray(json) && json.length > 0) { setHooks(json); return }
      throw new Error('bad json')
    } catch {
      const mocks = MOCK_HOOKS(titulo)
      setHooks(formulas.map(f => mocks[f.id] || {
        formula: f.id, hook: `Hook de ejemplo para "${titulo}" usando ${f.label}`,
        porque: 'Genera impacto inmediato', variante: 'Versión corta del hook',
      }))
    } finally {
      setLoading(false)
    }
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Anchor size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Generador de Hooks</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>6 fórmulas probadas para detener el scroll y atrapar al lector</p>
          </div>
        </div>
      </div>

      {/* Formula selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          ELIGE UNA FÓRMULA O GENERA TODAS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          {FORMULAS.map(f => (
            <button key={f.id} onClick={() => setSelected(selectedFormula === f.id ? null : f.id)} style={{
              padding: '10px 12px', borderRadius: 10, border: '1px solid', cursor: 'pointer', textAlign: 'left',
              borderColor: selectedFormula === f.id ? f.color : 'var(--border)',
              background: selectedFormula === f.id ? `${f.color}15` : 'var(--bg-card)',
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: selectedFormula === f.id ? f.color : 'var(--text)' }}>{f.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
            </button>
          ))}
        </div>
        {selectedFormula && (
          <button onClick={() => setSelected(null)} style={{
            marginTop: 8, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
          }}>✕ Generar todas las fórmulas</button>
        )}
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TEMA O TÍTULO *</label>
            <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Cómo conseguir tus primeros 1000 suscriptores de email"
              onKeyDown={e => e.key === 'Enter' && generar()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>AUDIENCIA (opcional)</label>
            <input className="input" value={audiencia} onChange={e => setAudiencia(e.target.value)}
              placeholder="Ej: emprendedores de 25-40 años que quieren salir de su 9-5" />
          </div>
          <button className="btn btn-primary" onClick={generar}
            disabled={loading || !titulo.trim()} style={{ alignSelf: 'flex-start' }}>
            {loading
              ? <><Loader2 size={16} className="spin" /> Generando hooks...</>
              : `🪝 Generar ${selectedFormula ? '1 hook' : '6 hooks'}`}
          </button>
        </div>
      </div>

      {/* Results */}
      {hooks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{hooks.length} hooks listos para usar</h3>
            <button onClick={generar} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}><RefreshCw size={13} /> Regenerar</button>
          </div>

          {hooks.map((h, i) => {
            const formula = FORMULAS.find(f => f.id === h.formula) || FORMULAS[i % FORMULAS.length]
            return (
              <div key={i} className="card" style={{ borderLeft: `3px solid ${formula.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{formula.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: formula.color }}>{formula.label}</span>
                  </div>
                  <button onClick={() => copiar(h.hook, `hook-${i}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 10px',
                    borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
                    background: copied === `hook-${i}` ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: copied === `hook-${i}` ? '#10b981' : 'var(--text-muted)',
                  }}>
                    {copied === `hook-${i}` ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>

                <div style={{
                  fontSize: 15, color: 'var(--text)', lineHeight: 1.7, padding: '12px 16px',
                  background: 'rgba(0,0,0,0.15)', borderRadius: 10, marginBottom: 12,
                  borderLeft: `2px solid ${formula.color}40`,
                }}>
                  "{h.hook}"
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  <span style={{ color: formula.color, fontWeight: 600 }}>⚡ Por qué funciona:</span> {h.porque}
                </div>

                <div style={{
                  padding: '8px 12px', background: `${formula.color}08`,
                  borderRadius: 8, border: `1px solid ${formula.color}20`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: formula.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Variante corta</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{h.variante}</div>
                  <button onClick={() => copiar(h.variante, `var-${i}`)} style={{
                    marginTop: 6, fontSize: 10, color: formula.color, background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {copied === `var-${i}` ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar variante</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
