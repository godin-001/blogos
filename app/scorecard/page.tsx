'use client'
import { useState, useEffect } from 'react'

const DIMENSIONS = [
  { id: 'seo', icon: '🔍', label: 'Potencial SEO', weight: 15,
    desc: 'Keyword +5K/mo, KD<40, tendencia ↑',
    levels: ['Sin keyword viable','KW 500+/KD<60','KW 5K+/KD<40/tendencia ↑'] },
  { id: 'edu', icon: '💡', label: 'Valor educativo', weight: 15,
    desc: 'Habilidad aplicable en 24h con ejemplo real',
    levels: ['Contenido relleno','Conceptos claros sin ejemplo','Habilidad aplicable en 24h con ejemplo'] },
  { id: 'ret', icon: '🎭', label: 'Retención', weight: 15,
    desc: 'Imposible dejar de leer',
    levels: ['Abandonan antes del 30%','Interesante pero pierde ritmo','Imposible dejar de leer'] },
  { id: 'share', icon: '🔗', label: 'Compartibilidad', weight: 10,
    desc: 'Tiene una frase/stat que se copia sola',
    levels: ['Genérico','Útil pero no memorable','Frase o dato que se copia solo'] },
  { id: 'eeat', icon: '🏛', label: 'E-E-A-T', weight: 15,
    desc: 'Experiencia real + fuentes + datos verificables',
    levels: ['Sin credenciales','Teoría bien explicada','Experiencia real + fuentes + datos'] },
  { id: 'rev', icon: '💰', label: 'Ruta de ingresos', weight: 10,
    desc: 'Link de conversión directo y medible',
    levels: ['Sin monetización','Construye lista/confianza','Link de conversión directo'] },
  { id: 'cla', icon: '🎯', label: 'Claridad', weight: 10,
    desc: 'Un adolescente de 14 años lo entiende',
    levels: ['Confuso','Necesita conocimiento previo','Lo entiende cualquier persona'] },
  { id: 'hook', icon: '🧲', label: 'Poder del hook', weight: 10,
    desc: 'Las primeras 2 líneas son imposibles de ignorar',
    levels: ['Apertura genérica','Interesante pero lento','Primeras 2 líneas imposibles de ignorar'] },
]

const STORAGE_KEY = 'blogos_scorecards'

interface Scorecard {
  id: string
  titulo: string
  fecha: string
  scores: Record<string, number>
  total: number
  decision: string
}

export default function ScorecardPage() {
  const [titulo, setTitulo] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState<Scorecard[]>([])
  const [activeTab, setActiveTab] = useState<'nuevo'|'historial'>('nuevo')

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) setSaved(JSON.parse(data))
  }, [])

  const total = DIMENSIONS.reduce((acc, d) => {
    const s = scores[d.id] ?? 0
    return acc + (s / 2) * (d.weight / 100) * 100
  }, 0)

  const getDecision = (t: number) => {
    if (t >= 80) return { label: '🚀 Publicar y promover agresivamente', color: '#10b981' }
    if (t >= 65) return { label: '✏️ Reescribir hook + estructura + agregar datos', color: '#f59e0b' }
    return { label: '🗑 Descartar o reinventar el ángulo completamente', color: '#ef4444' }
  }

  const decision = getDecision(total)

  const save = () => {
    if (!titulo.trim()) return
    const card: Scorecard = {
      id: Date.now().toString(),
      titulo,
      fecha: new Date().toLocaleDateString('es-MX'),
      scores,
      total: Math.round(total),
      decision: decision.label,
    }
    const updated = [card, ...saved]
    setSaved(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setTitulo('')
    setScores({})
    setActiveTab('historial')
  }

  const del = (id: string) => {
    const updated = saved.filter(s => s.id !== id)
    setSaved(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const radius = 54
  const circ = 2 * Math.PI * radius
  const filled = circ - (circ * total) / 100

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          🎯 Scorecard APEX
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Puntúa cada artículo en 8 dimensiones antes de publicar. Score ≥80 = publicar. &lt;65 = descartar.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['nuevo','historial'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none',
              background: activeTab === t ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'var(--bg-card)',
              color: activeTab === t ? 'white' : 'var(--text-muted)',
            }}>
            {t === 'nuevo' ? '+ Evaluar artículo' : `Historial (${saved.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'nuevo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
          <div>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título del artículo a evaluar..."
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 10,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 15, marginBottom: 20,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DIMENSIONS.map(d => (
                <div key={d.id} style={{
                  padding: 18, borderRadius: 14,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{d.icon} {d.label}</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>peso: {d.weight}%</span>
                    </div>
                    <span style={{
                      fontSize: 22, fontWeight: 900,
                      background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {((scores[d.id] ?? 0) / 2 * d.weight / 100 * 100).toFixed(0)}
                      <span style={{ fontSize: 11, fontWeight: 400, WebkitTextFillColor: 'var(--text-muted)' }}> pts</span>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {d.levels.map((lv, i) => (
                      <button key={i} onClick={() => setScores(s => ({ ...s, [d.id]: i }))}
                        style={{
                          padding: '10px 8px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                          textAlign: 'center', lineHeight: 1.4, fontWeight: 500,
                          border: `1px solid ${scores[d.id] === i ? (i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981') : 'var(--border)'}`,
                          background: scores[d.id] === i
                            ? (i === 0 ? 'rgba(239,68,68,.15)' : i === 1 ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)')
                            : 'var(--bg-base)',
                          color: scores[d.id] === i
                            ? (i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981')
                            : 'var(--text-muted)',
                        }}>
                        {i === 0 ? '0 pts' : i === 1 ? '5 pts' : '10 pts'}<br />
                        <span style={{ fontSize: 10 }}>{lv}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score widget */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{
              padding: 24, borderRadius: 20, background: 'var(--bg-card)',
              border: '1px solid var(--border)', textAlign: 'center', marginBottom: 16,
            }}>
              <svg width={140} height={140} viewBox="0 0 140 140" style={{ margin: '0 auto 12px' }}>
                <circle cx={70} cy={70} r={radius} fill="none" stroke="var(--border)" strokeWidth={10} />
                <circle cx={70} cy={70} r={radius} fill="none"
                  stroke="url(#grad)" strokeWidth={10}
                  strokeDasharray={circ} strokeDashoffset={filled}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dashoffset .4s ease' }}
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <text x={70} y={65} textAnchor="middle" fill="white" fontSize={28} fontWeight={900}>{Math.round(total)}</text>
                <text x={70} y={82} textAnchor="middle" fill="#64748b" fontSize={12}>/ 100</text>
              </svg>

              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: `${decision.color}18`,
                border: `1px solid ${decision.color}44`,
                fontSize: 13, fontWeight: 600, color: decision.color,
                marginBottom: 16, lineHeight: 1.4,
              }}>
                {decision.label}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {DIMENSIONS.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 80, color: 'var(--text-muted)', textAlign: 'right' }}>{d.icon} {d.label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${(scores[d.id] ?? 0) / 2 * 100}%`,
                        background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                        transition: 'width .3s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={save} disabled={!titulo.trim()}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: titulo.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'var(--border)',
                  color: titulo.trim() ? 'white' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 14, cursor: titulo.trim() ? 'pointer' : 'not-allowed',
                }}>
                Guardar evaluación
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div>No hay evaluaciones guardadas aún.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {saved.map(s => (
                <div key={s.id} style={{
                  padding: '18px 20px', borderRadius: 14,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.fecha} · {s.decision}</div>
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 900, minWidth: 64, textAlign: 'center',
                    color: s.total >= 80 ? '#10b981' : s.total >= 65 ? '#f59e0b' : '#ef4444'
                  }}>
                    {s.total}
                  </div>
                  <button onClick={() => del(s.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
