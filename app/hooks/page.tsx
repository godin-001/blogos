'use client'
import { useState } from 'react'
import { callChat, getProfile } from '@/lib/api'

const FORMULAS = [
  {
    id: 'stat', icon: '📊', name: 'Estadística Imposible',
    desc: 'Un dato que contradice lo que todos creen',
    template: (t: string) => `El ${Math.floor(Math.random()*70+20)}% de las personas que intentan "${t}" fracasan en los primeros 90 días — no por falta de talento, sino por esta razón.`,
    prompt: (t: string, n: string) => `Genera una estadística impactante y real (o plausible) sobre "${t}" en el nicho de ${n}. Debe ser contraintuitiva y generar curiosidad. Solo la estadística, 1-2 líneas.`,
  },
  {
    id: 'paradox', icon: '🔄', name: 'Paradoja',
    desc: 'Dos ideas opuestas que ambas son verdad',
    template: (t: string) => `Cuanto más rápido intentas "${t}", más lento llegas. Y cuanto más lento vas, más rápido llegas.`,
    prompt: (t: string, n: string) => `Crea una paradoja poderosa sobre "${t}" en el nicho de ${n}. Formato: "Cuanto más X, menos Y. Cuanto menos X, más Y." Solo la paradoja, máximo 2 líneas.`,
  },
  {
    id: 'question', icon: '❓', name: 'Pregunta Imposible',
    desc: 'Una pregunta que el lector no puede ignorar',
    template: (t: string) => `¿Por qué las personas que más saben sobre "${t}" son las que menos lo practican?`,
    prompt: (t: string, n: string) => `Genera una pregunta retórica imposible de ignorar sobre "${t}" en el nicho de ${n}. Debe crear curiosidad inmediata y hacer al lector cuestionarse algo que creía saber. Solo la pregunta.`,
  },
  {
    id: 'story', icon: '📖', name: 'Micro-historia',
    desc: '2 líneas que crean una escena y una emoción',
    template: (t: string) => `Eran las 2 AM. Tenía 3 pestañas abiertas sobre "${t}" y seguía sin entender por qué no le funcionaba a nadie más que a mí.`,
    prompt: (t: string, n: string) => `Escribe una micro-historia de 2-3 líneas sobre "${t}" en el nicho de ${n}. Debe crear una escena visual específica que el lector sienta como propia. Sin explicaciones, solo la historia.`,
  },
  {
    id: 'contra', icon: '💣', name: 'Contrarian',
    desc: 'Niega lo que todos dan por cierto',
    template: (t: string) => `Todo lo que te dijeron sobre "${t}" está equivocado. Y llevas años pagando el precio.`,
    prompt: (t: string, n: string) => `Genera un hook contrarian sobre "${t}" en el nicho de ${n}. Debe negar una creencia común y hacer al lector dudar de algo que daba por sentado. 1-2 líneas directas.`,
  },
  {
    id: 'result', icon: '🎯', name: 'Resultado Específico',
    desc: 'El resultado exacto que el lector va a obtener',
    template: (t: string) => `En los próximos 7 minutos vas a saber exactamente cómo "${t}" — sin cursos, sin experiencia previa y sin gastar un peso.`,
    prompt: (t: string, n: string) => `Crea un hook de resultado específico sobre "${t}" en el nicho de ${n}. Debe mencionar el tiempo exacto, el resultado concreto y eliminar las principales objeciones. 1-2 líneas.`,
  },
]

export default function HooksPage() {
  const [topic, setTopic] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string|null>(null)
  const [copied, setCopied] = useState<string|null>(null)
  const [mode, setMode] = useState<'all'|string>('all')

  const profile = typeof window !== 'undefined' ? getProfile() : null
  const niche = profile?.niche || 'emprendimiento'

  const generate = async (formulaId: string) => {
    if (!topic.trim()) return
    const f = FORMULAS.find(f => f.id === formulaId)
    if (!f) return
    setLoading(formulaId)
    try {
      const res = await callChat(f.prompt(topic, niche), 'reflexion', profile)
      setResults(prev => ({ ...prev, [formulaId]: res.text || f.template(topic) }))
    } catch {
      setResults(prev => ({ ...prev, [formulaId]: f.template(topic) }))
    }
    setLoading(null)
  }

  const generateAll = async () => {
    if (!topic.trim()) return
    for (const f of FORMULAS) {
      setLoading(f.id)
      try {
        const res = await callChat(f.prompt(topic, niche), 'reflexion', profile)
        setResults(prev => ({ ...prev, [f.id]: res.text || f.template(topic) }))
      } catch {
        setResults(prev => ({ ...prev, [f.id]: f.template(topic) }))
      }
      await new Promise(r => setTimeout(r, 300))
    }
    setLoading(null)
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🪝 Generador de Hooks</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Las primeras 2 líneas de tu artículo deciden si alguien lo lee o lo cierra. Genera 6 versiones de hook para cada artículo y elige la mejor.
        </p>
      </div>

      {/* Input */}
      <div style={{
        padding: 20, borderRadius: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>TEMA DEL ARTÍCULO</label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateAll()}
            placeholder="ej: cómo ganar dinero con un blog, email marketing, SEO para principiantes..."
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              background: 'var(--bg-base)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14,
            }}
          />
        </div>
        <button onClick={generateAll} disabled={!topic.trim() || loading !== null}
          style={{
            padding: '12px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            background: topic.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'var(--border)',
            color: topic.trim() ? 'white' : 'var(--text-muted)',
          }}>
          {loading ? '⏳ Generando...' : '⚡ Generar todos'}
        </button>
      </div>

      {/* Formulas grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {FORMULAS.map(f => (
          <div key={f.id} style={{
            padding: 20, borderRadius: 16, background: 'var(--bg-card)',
            border: `1px solid ${results[f.id] ? 'rgba(124,58,237,.4)' : 'var(--border)'}`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{f.icon} {f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
              <button onClick={() => generate(f.id)} disabled={!topic.trim() || loading === f.id}
                style={{
                  padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(124,58,237,.4)',
                  background: 'rgba(124,58,237,.1)', color: '#a78bfa',
                  fontSize: 12, fontWeight: 600, cursor: topic.trim() ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}>
                {loading === f.id ? '...' : '↺ Regenerar'}
              </button>
            </div>

            {results[f.id] ? (
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)',
                fontSize: 14, lineHeight: 1.6, color: 'var(--text)', flex: 1,
                fontStyle: 'italic',
              }}>
                "{results[f.id]}"
              </div>
            ) : (
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
                fontStyle: 'italic', flex: 1,
              }}>
                Escribe un tema y genera tu hook →
              </div>
            )}

            {results[f.id] && (
              <button onClick={() => copy(results[f.id], f.id)}
                style={{
                  padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                  background: copied === f.id ? 'rgba(16,185,129,.15)' : 'none',
                  color: copied === f.id ? '#10b981' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                {copied === f.id ? '✓ Copiado' : '📋 Copiar hook'}
              </button>
            )}
          </div>
        ))}
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{
          marginTop: 24, padding: 16, borderRadius: 12,
          background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)',
          fontSize: 13, color: '#fbbf24',
        }}>
          💡 <strong>Tip APEX:</strong> Testea 3 hooks distintos como títulos alternativos en Google. El que tenga mayor CTR en 2 semanas → es tu ganador. Aplícalo al artículo principal.
        </div>
      )}
    </div>
  )
}
