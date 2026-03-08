'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Sparkles, Search, Copy, Check, AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { callChat, callSeoResearch } from '@/lib/api'

type SeoResult = {
  score: number
  keyword: string
  metaDesc: string
  titulo_alternativo: string[]
  fortalezas: string[]
  mejoras: string[]
  densidadKw: number
  legibilidad: string
}

type SerperResult = {
  keyword: string
  dificultad: string
  top_resultados: { titulo: string; url: string; snippet: string; posicion: number }[]
  noticias_recientes: { titulo: string; url: string; fuente: string; fecha: string }[]
  keywords_relacionadas: string[]
  total_resultados: string
  fuente: string
}

const COPY_FORMULAS = [
  {
    name: 'PAS',
    full: 'Problema → Agitación → Solución',
    emoji: '🎯',
    color: '#7c3aed',
    desc: 'Identifica el problema, hazlo sentir más urgente, luego presenta la solución. Clásico del copywriting persuasivo.',
    ejemplo: '"¿Tu blog no genera tráfico? Es frustrante ver 0 visitas después de horas trabajando. Aquí está el sistema que lo cambia."',
    cuando: 'Artículos de problema/solución, landing pages, emails de venta.',
  },
  {
    name: 'AIDA',
    full: 'Atención → Interés → Deseo → Acción',
    emoji: '🔥',
    color: '#f59e0b',
    desc: 'El modelo más universal del marketing. Guía al lector paso a paso hasta la conversión.',
    ejemplo: '"Titular impactante → Dato que sorprende → Beneficio específico y tangible → "Haz clic aquí para empezar".',
    cuando: 'Artículos de producto, reviews, cualquier contenido con CTA.',
  },
  {
    name: 'BAB',
    full: 'Before → After → Bridge',
    emoji: '✨',
    color: '#10b981',
    desc: 'Muestra la situación actual dolorosa (antes), pinta el futuro ideal (después), y ofreces el puente.',
    ejemplo: '"Antes: 0 lectores. Después: 10,000 visitas/mes. El puente: esta metodología de 5 pasos."',
    cuando: 'Casos de estudio, testimoniales, artículos de transformación.',
  },
  {
    name: '4P',
    full: 'Promise → Picture → Proof → Push',
    emoji: '💎',
    color: '#06b6d4',
    desc: 'Promesa → Imagen del resultado → Prueba social → Llamado final. Formula de alta conversión.',
    ejemplo: '"Aprende a monetizar tu blog en 90 días → imagina tener ingresos pasivos → [100 casos de éxito] → empieza hoy."',
    cuando: 'Ofertas de alto valor, contenido premium, lanzamientos.',
  },
]

const DIFICULTAD_COLOR: Record<string, string> = {
  Alta: '#ef4444',
  Media: '#f59e0b',
  Baja: '#10b981',
}

export default function SeoPage() {
  const [article, setArticle] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSerper, setLoadingSerper] = useState(false)
  const [result, setResult] = useState<SeoResult | null>(null)
  const [serperResult, setSerperResult] = useState<SerperResult | null>(null)
  const [error, setError] = useState('')
  const [copiedItem, setCopiedItem] = useState('')
  const [profile, setProfile] = useState<Record<string, string> | null>(null)
  const [activeFormula, setActiveFormula] = useState<number | null>(null)
  const [seoTab, setSeoTab] = useState<'analisis' | 'google' | 'formulas'>('analisis')

  useEffect(() => {
    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))
  }, [])

  const analyzeArticle = async () => {
    if (!article.trim()) return
    setLoading(true)
    setError('')
    try {
      const prompt = `Analiza este artículo para SEO y copywriting:
KEYWORD OBJETIVO: "${keyword || 'no especificado'}"
ARTÍCULO:
${article}
Responde SOLO con JSON válido sin markdown ni texto adicional:
{"score":number,"keyword":"string","metaDesc":"string de max 155 chars","titulo_alternativo":["","",""],"fortalezas":["","",""],"mejoras":["","",""],"densidadKw":number,"legibilidad":"Excelente|Buena|Regular|Mejorable"}`

      const data = await callChat({ mode: 'seo', profile, messages: [{ role: 'user', content: prompt }] })

      if (data.needsKey) { setError('⚠️ Agrega tu API key de Anthropic en Configuración → APIs.'); setLoading(false); return }
      if (data.error) throw new Error(data.error)

      const jsonMatch = data.text?.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No se pudo parsear')
      setResult(JSON.parse(jsonMatch[0]))
    } catch {
      setError('Error al analizar. Usando resultado demo.')
      setResult({
        score: 72, keyword: keyword || 'blog estratégico',
        metaDesc: 'Descubre cómo crear blogs de alto nivel con estrategia SEO, copywriting persuasivo y metodología probada.',
        titulo_alternativo: ['7 estrategias SEO para bloggers en 2026', 'Cómo crear artículos que ranqueen: guía completa', 'El método que me llevó de 0 a 10,000 visitas'],
        fortalezas: ['Título atractivo con número', 'Buen uso de subtítulos', 'Contenido original y específico'],
        mejoras: ['Añadir keyword en el primer párrafo', 'Meta description más específica', 'Incluir más datos y estadísticas'],
        densidadKw: 1.2, legibilidad: 'Buena',
      })
    }
    setLoading(false)
  }

  const researchKeyword = async () => {
    setLoadingSerper(true)
    setError('')
    try {
      const data = await callSeoResearch({ keyword: keyword || profile?.niche || 'marketing digital' })
      setSerperResult(data)
    } catch {
      setError('Error al investigar. Mostrando datos demo.')
    }
    setLoadingSerper(false)
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(id)
    setTimeout(() => setCopiedItem(''), 2000)
  }

  const getScoreColor = (score: number) => score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (score: number) => score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'Necesita trabajo'

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>📈 SEO & Copywriting</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Optimiza para buscadores, investiga la competencia y escribe para persuadir
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 10, width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'analisis', label: '🔬 Análisis IA' },
          { id: 'google', label: '🌐 Google Research' },
          { id: 'formulas', label: '✍️ Copywriting' },
        ].map(t => (
          <button key={t.id} onClick={() => setSeoTab(t.id as 'analisis' | 'google' | 'formulas')} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', transition: 'all 0.2s',
            background: seoTab === t.id ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'transparent',
            color: seoTab === t.id ? 'white' : 'var(--text-muted)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB 1: Análisis IA ── */}
      {seoTab === 'analisis' && (
        <>
          <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              🔍 Analizar artículo con IA
            </h2>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" placeholder="Keyword objetivo (ej: cómo monetizar un blog)"
                value={keyword} onChange={e => setKeyword(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <textarea className="textarea-field" placeholder="Pega tu artículo completo aquí (título + contenido)..."
              value={article} onChange={e => setArticle(e.target.value)} style={{ minHeight: 140, marginBottom: 12 }} />
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}
            <button className="btn-primary" onClick={analyzeArticle} disabled={loading || !article.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: article.trim() ? 1 : 0.5 }}>
              {loading ? <Sparkles size={16} className="animate-spin" /> : <TrendingUp size={16} />}
              {loading ? 'Analizando...' : 'Analizar con IA'}
            </button>
          </div>

          {result && (
            <div className="animate-fade-in">
              {/* Score */}
              <div className="card" style={{ padding: '20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${getScoreColor(result.score)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: getScoreColor(result.score) }}>{result.score}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(result.score), marginTop: 6 }}>{getScoreLabel(result.score)}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Keyword', value: result.keyword, color: '#a78bfa' },
                      { label: 'Densidad KW', value: `${result.densidadKw}%`, color: result.densidadKw > 3 ? '#f87171' : '#34d399' },
                      { label: 'Legibilidad', value: result.legibilidad, color: 'var(--text)' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meta description */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📝 Meta Description</div>
                  <button onClick={() => copyText(result.metaDesc, 'meta')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {copiedItem === 'meta' ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{result.metaDesc}</p>
                <div style={{ fontSize: 11, color: result.metaDesc.length > 155 ? '#f87171' : '#34d399', marginTop: 6 }}>
                  {result.metaDesc.length}/155 caracteres
                </div>
              </div>

              {/* Alt titles */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>🎯 Títulos Alternativos</div>
                {result.titulo_alternativo.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 8, background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, marginRight: 10 }}>{t}</span>
                    <button onClick={() => copyText(t, `t${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {copiedItem === `t${i}` ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Strengths & improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 12 }}>✅ Fortalezas</div>
                  {result.fortalezas.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 12 }}>⚡ Mejoras</div>
                  {result.mejoras.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <AlertCircle size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Google Research ── */}
      {seoTab === 'google' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              🌐 Investiga tu keyword en Google
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Ve qué está ranqueando, qué noticias existen y qué keywords relacionadas busca tu audiencia.
              {!localStorage.getItem('blogos_api_keys')?.includes('serper') ? ' (Modo demo — agrega Serper en APIs para datos reales)' : ''}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" placeholder="Keyword a investigar..."
                  value={keyword} onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && researchKeyword()}
                  style={{ paddingLeft: 36 }} />
              </div>
              <button className="btn-primary" onClick={researchKeyword} disabled={loadingSerper}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {loadingSerper ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
                {loadingSerper ? 'Buscando...' : 'Investigar'}
              </button>
            </div>
          </div>

          {serperResult && (
            <div className="animate-fade-in">
              {/* Summary */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Keyword</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>{serperResult.keyword}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dificultad</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: DIFICULTAD_COLOR[serperResult.dificultad] || '#fbbf24' }}>
                      {serperResult.dificultad}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resultados totales</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{serperResult.total_resultados}</div>
                  </div>
                  {serperResult.fuente === 'demo' && (
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)' }}>
                      DEMO — agrega Serper para datos reales
                    </span>
                  )}
                </div>
              </div>

              {/* Keywords relacionadas */}
              {serperResult.keywords_relacionadas?.length > 0 && (
                <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
                    🔗 Keywords relacionadas
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {serperResult.keywords_relacionadas.map(kw => (
                      <button key={kw} onClick={() => setKeyword(kw)} style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                        background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                        color: '#a78bfa',
                      }}>#{kw}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Top resultados */}
              {serperResult.top_resultados?.length > 0 && (
                <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                    🏆 Top resultados en Google
                  </div>
                  {serperResult.top_resultados.map((r, i) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < serperResult.top_resultados.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', padding: '1px 6px', borderRadius: 4 }}>#{r.posicion}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4' }}>{r.titulo}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.snippet}</div>
                        </div>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Noticias */}
              {serperResult.noticias_recientes?.length > 0 && (
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                    📰 Noticias recientes
                  </div>
                  {serperResult.noticias_recientes.map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', borderRadius: 6, border: '1px solid rgba(245,158,11,0.25)', whiteSpace: 'nowrap', fontWeight: 600 }}>{n.fuente}</span>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{n.titulo}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{n.fecha}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!serperResult && !loadingSerper && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Ingresa una keyword y haz clic en "Investigar"</p>
              <p style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>
                Con Serper API obtienes datos reales de Google en tiempo real
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Fórmulas ── */}
      {seoTab === 'formulas' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Fórmulas probadas para escribir contenido que convierte. Haz clic para ver ejemplos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COPY_FORMULAS.map((formula, i) => (
              <div key={formula.name} className="card card-hover"
                style={{ padding: '16px 20px', cursor: 'pointer', border: activeFormula === i ? `1px solid ${formula.color}` : '1px solid var(--border)' }}
                onClick={() => setActiveFormula(activeFormula === i ? null : i)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${formula.color}15`, border: `1px solid ${formula.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {formula.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: formula.color }}>{formula.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formula.full}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formula.desc}</div>
                  </div>
                </div>
                {activeFormula === i && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ padding: '12px', background: `${formula.color}08`, borderRadius: 8, border: `1px solid ${formula.color}20`, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: formula.color, fontWeight: 700, marginBottom: 4 }}>📝 EJEMPLO:</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{formula.ejemplo}</div>
                    </div>
                    <div style={{ padding: '10px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.15)' }}>
                      <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 700, marginBottom: 3 }}>✅ ÚSALA CUANDO:</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formula.cuando}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
