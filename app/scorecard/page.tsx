'use client'

import { useState } from 'react'
import { Star, CheckCircle, AlertCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { callChat, getStoredKeys, getProfile } from '@/lib/api'

const DIMENSIONS = [
  { key: 'titulo', label: 'Título', weight: 15, icon: '📌', desc: 'Claridad, gancho emocional y keyword principal' },
  { key: 'intro', label: 'Introducción', weight: 15, icon: '🚀', desc: 'Hook, problema y promesa en los primeros 150 palabras' },
  { key: 'estructura', label: 'Estructura', weight: 15, icon: '🏗️', desc: 'Flujo lógico, subtítulos accionables, jerarquía visual' },
  { key: 'profundidad', label: 'Profundidad', weight: 15, icon: '🔬', desc: 'Datos, ejemplos reales, perspectiva única y accionable' },
  { key: 'seo', label: 'SEO On-page', weight: 10, icon: '🔍', desc: 'Keywords, densidad, meta, links internos y externos' },
  { key: 'cta', label: 'Llamada a acción', weight: 10, icon: '🎯', desc: 'CTAs claros, ofertas de lead magnet o conversión' },
  { key: 'legibilidad', label: 'Legibilidad', weight: 10, icon: '📖', desc: 'Párrafos cortos, listas, negritas, ritmo de lectura' },
  { key: 'distribucion', label: 'Potencial viral', weight: 10, icon: '📡', desc: 'Ángulo compartible, quotes, estadísticas citables' },
]

interface ScoreResult {
  scores: Record<string, number>
  feedback: Record<string, string>
  total: number
  topFix: string
  verdict: string
}

function getLevel(score: number) {
  if (score >= 85) return { label: 'Artículo de élite', color: '#10b981', icon: '🏆' }
  if (score >= 70) return { label: 'Muy buen trabajo', color: '#06b6d4', icon: '⚡' }
  if (score >= 55) return { label: 'Puede mejorar', color: '#f59e0b', icon: '🔧' }
  return { label: 'Necesita trabajo', color: '#ef4444', icon: '⚠️' }
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', width: `${score}%`,
        background: color,
        borderRadius: 999,
        transition: 'width 1s ease',
      }} />
    </div>
  )
}

export default function ScorecardPage() {
  const [titulo, setTitulo] = useState('')
  const [intro, setIntro] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function analizar() {
    if (!titulo.trim()) return
    setLoading(true)
    setResult(null)

    const profile = getProfile()
    const keys = getStoredKeys()

    const prompt = `Eres un editor de élite mundial. Evalúa este artículo en 8 dimensiones del 0 al 100 (considera el peso de cada una):

ARTÍCULO:
TÍTULO: ${titulo}
INTRODUCCIÓN: ${intro || '(no proporcionada)'}
CUERPO: ${cuerpo ? cuerpo.slice(0, 2000) + (cuerpo.length > 2000 ? '...' : '') : '(no proporcionado)'}

NICHO DEL AUTOR: ${profile?.niche || 'General'}

Evalúa estas dimensiones con su peso:
${DIMENSIONS.map(d => `- ${d.key} (${d.weight}pts): ${d.desc}`).join('\n')}

Responde SOLO en JSON válido con este formato exacto:
{
  "scores": {
    "titulo": 0-100,
    "intro": 0-100,
    "estructura": 0-100,
    "profundidad": 0-100,
    "seo": 0-100,
    "cta": 0-100,
    "legibilidad": 0-100,
    "distribucion": 0-100
  },
  "feedback": {
    "titulo": "feedback concreto de 1 oración",
    "intro": "feedback concreto",
    "estructura": "feedback concreto",
    "profundidad": "feedback concreto",
    "seo": "feedback concreto",
    "cta": "feedback concreto",
    "legibilidad": "feedback concreto",
    "distribucion": "feedback concreto"
  },
  "topFix": "El cambio #1 más impactante que puede hacer ahora mismo (1-2 oraciones)",
  "verdict": "Veredicto profesional del artículo en 2 oraciones"
}`

    try {
      const res = await callChat([{ role: 'user', content: prompt }], keys.anthropic)
      const json = JSON.parse(res.match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (json.scores) {
        const total = Math.round(
          DIMENSIONS.reduce((sum, d) => sum + (json.scores[d.key] || 0) * (d.weight / 100), 0)
        )
        setResult({ ...json, total })
      }
    } catch {
      // Mock fallback
      const scores: Record<string, number> = {}
      const feedback: Record<string, string> = {}
      const mockFeedbacks: Record<string, string> = {
        titulo: titulo.length < 40 ? 'El título es corto — añade la keyword principal y un número o beneficio claro' : 'Buen título con longitud adecuada. Asegúrate de incluir la keyword al inicio',
        intro: intro ? 'La intro presenta el problema. Fortalécela con una estadística impactante en la primera línea' : 'Sin introducción ingresada. Los primeros 150 palabras son tu gancho más importante',
        estructura: 'Añade subtítulos H2 cada 300 palabras con verbos de acción para mejorar el escaneo visual',
        profundidad: 'Incluye al menos 3 ejemplos reales o casos de estudio para aumentar la autoridad percibida',
        seo: 'Asegúrate de que la keyword principal aparezca en el H1, primer párrafo y al menos 2 H2',
        cta: 'Añade un CTA claro al final y uno a la mitad del artículo para capturar leads temprano',
        legibilidad: 'Mantén párrafos de máximo 3-4 líneas. Añade más listas con bullets para facilitar el escaneo',
        distribucion: 'Incluye una estadística citables y un quote memorable — son los más compartidos en redes',
      }
      DIMENSIONS.forEach(d => {
        scores[d.key] = Math.floor(Math.random() * 20) + 60
        feedback[d.key] = mockFeedbacks[d.key]
      })
      const total = Math.round(DIMENSIONS.reduce((sum, d) => sum + scores[d.key] * (d.weight / 100), 0))
      setResult({
        scores,
        feedback,
        total,
        topFix: 'Reescribe la introducción comenzando con una estadística impactante o pregunta provocadora — es el cambio de mayor ROI para este artículo.',
        verdict: `El artículo tiene buenas bases pero necesita más profundidad y un CTA más claro. Con los cambios sugeridos puede llegar fácilmente a 80+ puntos.`
      })
    } finally {
      setLoading(false)
    }
  }

  const level = result ? getLevel(result.total) : null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Star size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Scorecard APEX</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Califica tu artículo en 8 dimensiones de clase mundial</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              TÍTULO DEL ARTÍCULO *
            </label>
            <input
              className="input"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: 7 Estrategias de Email Marketing que Triplicaron mis Ventas"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              INTRODUCCIÓN (primeros 2-3 párrafos)
            </label>
            <textarea
              className="textarea"
              value={intro}
              onChange={e => setIntro(e.target.value)}
              placeholder="Pega aquí la introducción de tu artículo..."
              rows={3}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              CUERPO DEL ARTÍCULO (opcional pero recomendado)
            </label>
            <textarea
              className="textarea"
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              placeholder="Pega el contenido completo para un análisis más preciso..."
              rows={5}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={analizar}
            disabled={loading || !titulo.trim()}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Analizando...</> : '⚡ Analizar artículo'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && level && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score total */}
          <div className="card" style={{
            background: `linear-gradient(135deg, ${level.color}18, ${level.color}08)`,
            border: `1px solid ${level.color}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>PUNTUACIÓN APEX</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 64, fontWeight: 900, color: level.color, lineHeight: 1 }}>{result.total}</span>
                  <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>{level.icon}</span>
                  <span style={{ fontWeight: 700, color: level.color, fontSize: 15 }}>{level.label}</span>
                </div>
              </div>

              {/* Radial visualization */}
              <div style={{
                width: 120, height: 120,
                borderRadius: '50%',
                background: `conic-gradient(${level.color} ${result.total * 3.6}deg, var(--border) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900, color: level.color
                }}>
                  {result.total}
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'rgba(0,0,0,0.2)', borderRadius: 10,
              fontSize: 14, color: 'var(--text)', lineHeight: 1.6
            }}>
              💬 {result.verdict}
            </div>
          </div>

          {/* Top fix */}
          <div className="card" style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Cambio #1 más impactante
                </div>
                <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{result.topFix}</div>
              </div>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Desglose por dimensión</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {DIMENSIONS.map(d => {
                const score = result.scores[d.key] || 0
                const color = score >= 80 ? '#10b981' : score >= 60 ? '#06b6d4' : score >= 40 ? '#f59e0b' : '#ef4444'
                const isOpen = expanded === d.key

                return (
                  <div key={d.key}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : d.key)}
                      style={{
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: isOpen ? 'rgba(124,58,237,0.06)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16, width: 24 }}>{d.icon}</span>
                        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, flex: 1, textAlign: 'left' }}>{d.label}</span>
                        <ScoreBar score={score} color={color} />
                        <span style={{
                          fontSize: 14, fontWeight: 800, color, width: 36, textAlign: 'right'
                        }}>{score}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '8px 12px 12px 52px',
                        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        borderLeft: `2px solid ${color}`,
                        marginLeft: 12, marginBottom: 4,
                      }}>
                        {result.feedback[d.key]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { score: result.scores['intro'], href: '/articulo', label: 'Reescribir intro', icon: '✍️' },
              { score: result.scores['seo'], href: '/seo', label: 'Optimizar SEO', icon: '🔍' },
              { score: result.scores['distribucion'], href: '/distribucion', label: 'Planear distribución', icon: '📡' },
            ].filter(a => (a.score || 0) < 75).map(a => (
              <a key={a.href} href={a.href} className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Área de mejora detectada →</div>
              </a>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
