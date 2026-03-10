'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen, Flame, Target, Clock, ArrowRight, Pen,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, X,
  TrendingUp, Calendar, Star, Zap, Brain, MessageSquare
} from 'lucide-react'
import { getStoredKeys, getProfile } from '@/lib/api'

type Article = {
  id: string
  titulo: string
  gancho: string
  subtitulos: string
  ejemplos: string
  reflexion: string
  cta: string
  createdAt: string
}

type Pregunta = {
  pregunta: string
  categoria: string
  accion: string
  ia?: boolean
}

const CATEGORIA_COLORS: Record<string, string> = {
  valentía:    '#ef4444',
  ambición:    '#7c3aed',
  propósito:   '#06b6d4',
  mindset:     '#f59e0b',
  urgencia:    '#10b981',
  coraje:      '#ef4444',
  impacto:     '#06b6d4',
  visión:      '#a855f7',
  autenticidad:'#f59e0b',
  audiencia:   '#10b981',
  crecimiento: '#7c3aed',
  vulnerabilidad: '#ec4899',
  legado:      '#f59e0b',
  'síndrome del impostor': '#ef4444',
}

function getWordCount(a: Article) {
  const text = [a.titulo, a.gancho, a.subtitulos, a.ejemplos, a.reflexion, a.cta].join(' ')
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function getReadingTime(words: number) {
  return Math.max(1, Math.ceil(words / 200))
}

function getCompleteness(a: Article) {
  const fields = [a.titulo, a.gancho, a.subtitulos, a.ejemplos, a.reflexion, a.cta]
  return Math.round((fields.filter(f => f?.trim()).length / fields.length) * 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Componente: Tarjeta de pregunta motivacional ─────────────────
function PreguntaCard({ pregunta, onNueva, loading }: {
  pregunta: Pregunta | null
  onNueva: () => void
  loading: boolean
}) {
  const color = pregunta ? (CATEGORIA_COLORS[pregunta.categoria] || '#7c3aed') : '#7c3aed'

  return (
    <div className="card" style={{
      marginBottom: 28,
      background: `linear-gradient(135deg, ${color}12, ${color}06)`,
      border: `1px solid ${color}35`,
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: `${color}08`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={20} color={color} aria-hidden="true" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', color,
            }}>
              🔥 Pregunta del día
            </span>
            {pregunta?.ia && (
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 8,
                background: `${color}20`, color, fontWeight: 700,
              }}>IA</span>
            )}
            {pregunta?.categoria && (
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600,
              }}>{pregunta.categoria}</span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 18, background: `${color}20`, borderRadius: 6 }} className="skeleton-pulse" />
              <div style={{ height: 18, background: `${color}15`, borderRadius: 6, width: '80%' }} className="skeleton-pulse" />
            </div>
          ) : (
            <>
              <p style={{
                fontSize: 18, fontWeight: 700, color: 'var(--text)',
                lineHeight: 1.5, marginBottom: 16, fontStyle: 'italic',
              }}>
                &ldquo;{pregunta?.pregunta || '¿Qué artículo estás postergando que podría cambiarlo todo?'}&rdquo;
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/articulo" style={{ textDecoration: 'none' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8,
                    background: color, color: 'white',
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    <Pen size={13} aria-hidden="true" />
                    {pregunta?.accion || 'Escríbelo ahora'}
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </Link>
                <button
                  onClick={onNueva}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'transparent',
                    border: `1px solid ${color}40`,
                    color: 'var(--text-muted)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                  aria-label="Generar nueva pregunta"
                >
                  <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} aria-hidden="true" />
                  Nueva pregunta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente: Modal de artículo completo ───────────────────────
function ArticuloModal({ article, onClose }: { article: Article; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const words = getWordCount(article)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
      aria-label={`Artículo: ${article.titulo}`}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '32px',
      }}>
        {/* Header modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                📅 {formatDate(article.createdAt)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                📝 {words.toLocaleString()} palabras
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                ⏱ {getReadingTime(words)} min de lectura
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
              {article.titulo || 'Sin título'}
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 16, flexShrink: 0 }}
            aria-label="Cerrar artículo"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 24 }} />

        {/* Contenido */}
        {article.gancho && (
          <div style={{
            borderLeft: '3px solid #7c3aed', paddingLeft: 16,
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.8, fontStyle: 'italic' }}>
              {article.gancho}
            </p>
          </div>
        )}

        {article.subtitulos && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📋 Estructura</div>
            <pre style={{
              color: 'var(--text)', fontSize: 14, whiteSpace: 'pre-wrap',
              fontFamily: 'inherit', lineHeight: 1.8,
            }}>{article.subtitulos}</pre>
          </div>
        )}

        {article.ejemplos && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📖 Ejemplos e Historias</div>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.8 }}>{article.ejemplos}</p>
          </div>
        )}

        {article.reflexion && (
          <div style={{
            marginBottom: 24, padding: '16px 20px',
            background: 'rgba(124,58,237,0.07)', borderRadius: 10,
            border: '1px solid rgba(124,58,237,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🧠 Reflexión Final</div>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>{article.reflexion}</p>
          </div>
        )}

        {article.cta && (
          <div style={{
            padding: '14px 18px',
            background: 'rgba(16,185,129,0.08)', borderRadius: 10,
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>🚀 CTA</div>
            <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{article.cta}</p>
          </div>
        )}

        {/* Acciones */}
        <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: 13 }}
          >
            Cerrar
          </button>
          <Link href="/articulo" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: 13 }}>
              <Pen size={14} aria-hidden="true" /> Nuevo artículo
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Componente: Tarjeta de artículo ─────────────────────────────
function ArticuloCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const words   = getWordCount(article)
  const pct     = getCompleteness(article)
  const color   = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Ver artículo: ${article.titulo || 'Sin título'}`}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'rgba(124,58,237,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>✍️</div>
        <div style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 700,
          background: `${color}18`, color, border: `1px solid ${color}30`,
        }}>
          {pct}% completo
        </div>
      </div>

      {/* Título */}
      <div>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: 'var(--text)',
          lineHeight: 1.4, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.titulo || 'Sin título'}
        </h3>
        {article.gancho && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.gancho}
          </p>
        )}
      </div>

      {/* Barra de progreso de completitud */}
      <div className="progress-bar" style={{ height: 3 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} aria-hidden="true" /> {getReadingTime(words)} min
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <BookOpen size={10} aria-hidden="true" /> {words} palabras
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {formatDate(article.createdAt)}
        </span>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────
// v2 — 2026-03-10
export default function MiBlogPage() {
  const [articles, setArticles]     = useState<Article[]>([])
  const [pregunta, setPregunta]     = useState<Pregunta | null>(null)
  const [loadingQ, setLoadingQ]     = useState(true)
  const [historial, setHistorial]   = useState<string[]>([])
  const [selected, setSelected]     = useState<Article | null>(null)
  const [filter, setFilter]         = useState<'todos' | 'completos' | 'borradores'>('todos')
  const [profile, setProfile]       = useState<Record<string, string> | null>(null)
  const [showSesion, setShowSesion] = useState(false)
  const [sesionPreguntas, setSesionPreguntas] = useState<Pregunta[]>([])
  const [loadingSesion, setLoadingSesion] = useState(false)

  useEffect(() => {
    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))
    const arts = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    setArticles(arts.sort((a: Article, b: Article) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
    const h = JSON.parse(localStorage.getItem('blogos_preguntas_historial') || '[]')
    setHistorial(h)
    fetchPregunta(h, p ? JSON.parse(p) : null)
  }, [])

  const fetchPregunta = useCallback(async (hist: string[], prof: Record<string, string> | null) => {
    setLoadingQ(true)
    try {
      const keys    = getStoredKeys()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (keys.anthropic) headers['x-anthropic-key'] = keys.anthropic

      const res = await fetch('/api/pregunta-ambiciosa', {
        method: 'POST',
        headers,
        body: JSON.stringify({ niche: prof?.niche || 'emprendimiento', historial: hist }),
      })
      const data: Pregunta = await res.json()
      setPregunta(data)

      const newHist = [...hist, data.pregunta].slice(-10)
      setHistorial(newHist)
      localStorage.setItem('blogos_preguntas_historial', JSON.stringify(newHist))
    } catch {
      setPregunta({
        pregunta: '¿Cuál es el artículo que tienes miedo de escribir porque podría cambiarlo todo?',
        categoria: 'valentía',
        accion: 'Escríbelo hoy',
      })
    }
    setLoadingQ(false)
  }, [])

  const generarSesion = async () => {
    setLoadingSesion(true)
    setSesionPreguntas([])
    const keys = getStoredKeys()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (keys.anthropic) headers['x-anthropic-key'] = keys.anthropic

    const nuevas: Pregunta[] = []
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch('/api/pregunta-ambiciosa', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            niche: profile?.niche || 'emprendimiento',
            historial: [...historial, ...nuevas.map(q => q.pregunta)],
          }),
        })
        const data: Pregunta = await res.json()
        nuevas.push(data)
        setSesionPreguntas([...nuevas])
      } catch {}
    }
    setLoadingSesion(false)
  }

  // Stats
  const totalWords    = articles.reduce((acc, a) => acc + getWordCount(a), 0)
  const avgReadTime   = articles.length ? Math.round(articles.reduce((acc, a) => acc + getReadingTime(getWordCount(a)), 0) / articles.length) : 0
  const completos     = articles.filter(a => getCompleteness(a) >= 80).length

  const filtered = articles.filter(a => {
    if (filter === 'completos')  return getCompleteness(a) >= 80
    if (filter === 'borradores') return getCompleteness(a) < 80
    return true
  })

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          📚 Mi Blog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Tu biblioteca de artículos + preguntas que te hacen crecer
        </p>
      </div>

      {/* Pregunta del día */}
      <PreguntaCard
        pregunta={pregunta}
        onNueva={() => fetchPregunta(historial, profile)}
        loading={loadingQ}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Artículos escritos', value: articles.length, icon: BookOpen,  color: '#7c3aed' },
          { label: 'Completos (≥80%)',   value: completos,        icon: Star,      color: '#10b981' },
          { label: 'Palabras totales',   value: totalWords.toLocaleString(), icon: Target, color: '#06b6d4' },
          { label: 'Min lectura prom.',  value: avgReadTime ? `${avgReadTime} min` : '—', icon: Clock, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: `${s.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={16} color={s.color} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sesión de reflexión ambiciosa */}
      <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: showSesion ? 'rgba(124,58,237,0.06)' : 'transparent',
          }}
          onClick={() => { setShowSesion(!showSesion); if (!showSesion && sesionPreguntas.length === 0) generarSesion() }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(124,58,237,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={18} color="#a78bfa" aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                🧠 Sesión de cuestionamiento ambicioso
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                5 preguntas que desafían tu mentalidad — respóndelas antes de escribir
              </div>
            </div>
          </div>
          {showSesion ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>

        {showSesion && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
            {loadingSesion && sesionPreguntas.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ height: 64, background: 'var(--bg-base)', borderRadius: 10 }} className="skeleton-pulse" />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sesionPreguntas.map((q, i) => {
                  const color = CATEGORIA_COLORS[q.categoria] || '#7c3aed'
                  return (
                    <div key={i} style={{
                      padding: '16px',
                      background: `${color}08`,
                      border: `1px solid ${color}25`,
                      borderRadius: 10,
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: `${color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color,
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 8 }}>
                          {q.pregunta}
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 8,
                            background: `${color}15`, color, fontWeight: 600,
                          }}>{q.categoria}</span>
                          <Link href="/articulo" style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <Pen size={11} aria-hidden="true" /> {q.accion}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={generarSesion}
                  disabled={loadingSesion}
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={12} style={{ animation: loadingSesion ? 'spin 1s linear infinite' : 'none' }} aria-hidden="true" />
                  Nueva sesión de preguntas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artículos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Tus artículos ({filtered.length})
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todos', 'completos', 'borradores'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                border: `1px solid ${filter === f ? '#7c3aed' : 'var(--border)'}`,
                background: filter === f ? 'rgba(124,58,237,0.12)' : 'transparent',
                color: filter === f ? '#a78bfa' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: filter === f ? 700 : 400,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {filter === 'todos' ? 'Aún no tienes artículos' : `No hay artículos en "${filter}"`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {filter === 'todos'
              ? 'Responde una de las preguntas de arriba y escribe tu primer artículo.'
              : 'Prueba con otro filtro o escribe un nuevo artículo.'}
          </div>
          <Link href="/articulo" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">
              <Pen size={14} aria-hidden="true" /> Escribir mi primer artículo
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(article => (
            <ArticuloCard key={article.id} article={article} onClick={() => setSelected(article)} />
          ))}
        </div>
      )}

      {/* Motivación final si hay artículos */}
      {articles.length > 0 && (
        <div style={{
          marginTop: 28, padding: '16px 20px',
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Flame size={24} color="#10b981" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {articles.length >= 10
                ? `🏆 ${articles.length} artículos. Estás construyendo algo real.`
                : articles.length >= 5
                  ? `🔥 ${articles.length} artículos. El hábito se está formando.`
                  : `🌱 ${articles.length} artículo${articles.length > 1 ? 's' : ''}. Cada experto empezó con uno.`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {totalWords.toLocaleString()} palabras escritas · {completos} artículos completos · El siguiente es el más importante.
            </div>
          </div>
          <Link href="/articulo" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button className="btn-primary" style={{ fontSize: 12 }}>
              Escribir ahora <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Link>
        </div>
      )}

      {/* Modal de artículo */}
      {selected && <ArticuloModal article={selected} onClose={() => setSelected(null)} />}

    </div>
  )
}
