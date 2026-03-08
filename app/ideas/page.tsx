'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Sparkles, Bookmark, BookmarkCheck, TrendingUp, RefreshCw, Pen, Trash2, Filter, Newspaper } from 'lucide-react'
import Link from 'next/link'
import { callChat, callTendencias, getProfile } from '@/lib/api'

type Idea = {
  id: string
  titulo: string
  gancho: string
  tipo: string
  potencial: string
  keywords: string[]
  saved?: boolean
  createdAt?: string
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  educativo: { label: 'Educativo', emoji: '📚', color: 'badge-blue' },
  inspiracional: { label: 'Inspiracional', emoji: '✨', color: 'badge-purple' },
  opinion: { label: 'Opinión', emoji: '💬', color: 'badge-amber' },
  tecnico: { label: 'Técnico', emoji: '🔬', color: 'badge-green' },
  lista: { label: 'Lista', emoji: '📋', color: 'badge-blue' },
}

const POTENCIAL_COLORS: Record<string, string> = {
  alto: 'badge-green',
  medio: 'badge-amber',
  bajo: 'badge-red',
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([])
  const [tendencias, setTendencias] = useState<{ titulo: string; descripcion: string; fuente: string; fecha: string; url: string }[]>([])
  const [ideasTendencias, setIdeasTendencias] = useState<{ titulo: string; fuente_noticia: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTend, setLoadingTend] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState('')
  const [filter, setFilter] = useState('todos')
  const [tab, setTab] = useState<'generar' | 'tendencias' | 'guardadas'>('generar')
  const [profile, setProfile] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))
    const saved = localStorage.getItem('blogos_ideas')
    if (saved) setSavedIdeas(JSON.parse(saved))
  }, [])

  const loadTendencias = async () => {
    setLoadingTend(true)
    try {
      const data = await callTendencias({ niche: profile?.niche || '' })
      setTendencias(data.articulos || [])
      setIdeasTendencias(data.ideas_sugeridas || [])
    } catch {
      setTendencias([])
    }
    setLoadingTend(false)
  }

  useEffect(() => {
    if (tab === 'tendencias' && tendencias.length === 0) {
      loadTendencias()
    }
  }, [tab])

  const generateIdeas = async () => {
    setLoading(true)
    setError('')
    try {
      const userMsg = prompt.trim()
        ? `Genera 8 ideas de artículos para mi blog sobre: ${prompt}`
        : `Genera 8 ideas de artículos de alto potencial para un blog de ${profile?.niche || 'negocios y emprendimiento'}. 
           Audiencia: ${profile?.audience || 'emprendedores'}.`

      const data = await callChat({
        mode: 'ideas',
        profile,
        messages: [{ role: 'user', content: userMsg }],
      })

      if (data.needsKey) {
        setIdeas(getDemoIdeas(profile?.niche || 'negocios'))
        setLoading(false)
        return
      }
      if (data.error && !data.demo) throw new Error(data.error)

      // Parse JSON from response
      const jsonMatch = data.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No se pudo parsear la respuesta')
      const parsed: Omit<Idea, 'id'>[] = JSON.parse(jsonMatch[0])
      const withIds = parsed.map((idea, i) => ({
        ...idea,
        id: `idea-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
      }))
      setIdeas(withIds)
    } catch {
      setIdeas(getDemoIdeas(profile?.niche || 'negocios'))
    }
    setLoading(false)
  }

  const toggleSave = (idea: Idea) => {
    const isAlreadySaved = savedIdeas.some(s => s.id === idea.id)
    let updated: Idea[]
    if (isAlreadySaved) {
      updated = savedIdeas.filter(s => s.id !== idea.id)
    } else {
      updated = [...savedIdeas, { ...idea, saved: true }]
    }
    setSavedIdeas(updated)
    localStorage.setItem('blogos_ideas', JSON.stringify(updated))
  }

  const deleteIdea = (id: string) => {
    const updated = savedIdeas.filter(s => s.id !== id)
    setSavedIdeas(updated)
    localStorage.setItem('blogos_ideas', JSON.stringify(updated))
  }

  const isSaved = (id: string) => savedIdeas.some(s => s.id === id)

  const filteredIdeas = filter === 'todos' ? ideas : ideas.filter(i => i.tipo === filter || i.potencial === filter)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>💡 Generador de Ideas</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Genera ideas de artículos de alto impacto para tu nicho en segundos
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { id: 'generar', label: '✨ Generar' },
          { id: 'tendencias', label: '📰 Tendencias' },
          { id: 'guardadas', label: `🔖 Guardadas (${savedIdeas.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'generar' | 'tendencias' | 'guardadas')}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', transition: 'all 0.2s',
              background: tab === t.id ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'generar' && (
        <>
          {/* Generator input */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 10 }}>
              ¿Sobre qué quieres generar ideas? (opcional)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input-field"
                placeholder={`Ej: productividad para emprendedores, marketing sin presupuesto...`}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateIdeas()}
              />
              <button
                className="btn-primary"
                onClick={generateIdeas}
                disabled={loading}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {loading ? 'Generando...' : 'Generar'}
              </button>
            </div>
            {profile && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                🎯 Nicho detectado: <span style={{ color: '#a78bfa' }}>{profile.niche}</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: 16, borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 13
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Filter */}
          {ideas.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={14} color="var(--text-muted)" />
              {['todos', 'educativo', 'inspiracional', 'opinion', 'tecnico', 'lista', 'alto'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: filter === f ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                    background: filter === f ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: filter === f ? '#a78bfa' : 'var(--text-muted)',
                    fontWeight: filter === f ? 600 : 400
                  }}
                >
                  {f === 'todos' ? 'Todos' : f === 'alto' ? '🔥 Alto potencial' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Ideas grid */}
          {filteredIdeas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredIdeas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSaved={isSaved(idea.id)}
                  onSave={() => toggleSave(idea)}
                />
              ))}
            </div>
          ) : !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Lightbulb size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>Haz clic en "Generar" para obtener ideas personalizadas</p>
              <p style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>Usaremos tu perfil de escritor para darte ideas relevantes</p>
            </div>
          )}
        </>
      )}

      {tab === 'tendencias' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Noticias de <span style={{ color: '#a78bfa' }}>{profile?.niche || 'tu industria'}</span> para inspirar tus próximos artículos
            </div>
            <button className="btn-secondary" onClick={loadTendencias} disabled={loadingTend}
              style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} className={loadingTend ? 'animate-spin' : ''} />
              {loadingTend ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {ideasTendencias.length > 0 && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 16, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 12 }}>
                💡 Ideas sugeridas a partir de tendencias
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ideasTendencias.map((idea, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{idea.titulo}</span>
                    <Link href={`/articulo?idea=${encodeURIComponent(idea.titulo)}`}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', flexShrink: 0 }}>
                        <Pen size={15} />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingTend ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Cargando tendencias...</p>
            </div>
          ) : tendencias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Newspaper size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Sin tendencias cargadas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tendencias.map((art, i) => (
                <div key={i} className="card card-hover" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                          {art.fuente}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{art.fecha}</span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>{art.titulo}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{art.descripcion}</p>
                    </div>
                    <Link href={`/articulo?idea=${encodeURIComponent('Mi perspectiva sobre: ' + art.titulo)}`}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', flexShrink: 0, padding: 6 }} title="Escribir artículo sobre esto">
                        <Pen size={16} />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'guardadas' && (
        <div>
          {savedIdeas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Bookmark size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: 15 }}>No hay ideas guardadas todavía</p>
              <p style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>Guarda las ideas que más te gusten para desarrollarlas después</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {savedIdeas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSaved={true}
                  onSave={() => deleteIdea(idea.id)}
                  deleteMode
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IdeaCard({ idea, isSaved, onSave, deleteMode }: {
  idea: Idea
  isSaved: boolean
  onSave: () => void
  deleteMode?: boolean
}) {
  const tipo = TYPE_LABELS[idea.tipo] || { label: idea.tipo, emoji: '📝', color: 'badge-blue' }
  const potencial = POTENCIAL_COLORS[idea.potencial] || 'badge-blue'

  return (
    <div className="card card-hover" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${tipo.color}`}>{tipo.emoji} {tipo.label}</span>
            <span className={`badge ${potencial}`}>
              <TrendingUp size={10} style={{ marginRight: 4 }} />
              Potencial {idea.potencial}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>
            {idea.titulo}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
            {idea.gancho}
          </p>
          {idea.keywords && idea.keywords.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {idea.keywords.map(kw => (
                <span key={kw} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)'
                }}>
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onSave}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              color: deleteMode ? '#f87171' : isSaved ? '#a78bfa' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            title={deleteMode ? 'Eliminar' : isSaved ? 'Guardada' : 'Guardar'}
          >
            {deleteMode ? <Trash2 size={18} /> : isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
          <Link href={`/articulo?idea=${encodeURIComponent(idea.titulo)}`}>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              color: 'var(--text-muted)', transition: 'all 0.2s'
            }}
              title="Desarrollar artículo"
            >
              <Pen size={18} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function getDemoIdeas(niche: string): Idea[] {
  return [
    {
      id: `demo-1-${Date.now()}`,
      titulo: `7 errores que cometen los ${niche === 'negocios' ? 'emprendedores' : 'creadores'} al empezar (y cómo evitarlos)`,
      gancho: 'El 80% de los nuevos emprendedores comete los mismos errores. La buena noticia: son completamente evitables si los conoces antes de tiempo.',
      tipo: 'lista',
      potencial: 'alto',
      keywords: ['errores comunes', niche, 'guía práctica'],
    },
    {
      id: `demo-2-${Date.now()}`,
      titulo: `Por qué la consistencia importa más que el talento en ${niche}`,
      gancho: '¿Conoces a alguien más talentoso que tú pero menos exitoso? Este artículo explica exactamente por qué.',
      tipo: 'opinion',
      potencial: 'alto',
      keywords: ['consistencia', 'hábitos', 'éxito'],
    },
    {
      id: `demo-3-${Date.now()}`,
      titulo: `El método de 3 pasos para crear contenido que la gente comparte`,
      gancho: 'Hay una fórmula detrás de cada artículo viral. Después de analizar 100 posts exitosos, la encontré.',
      tipo: 'educativo',
      potencial: 'alto',
      keywords: ['contenido viral', 'metodología', 'compartir'],
    },
    {
      id: `demo-4-${Date.now()}`,
      titulo: `Cómo moneticé mi blog con 0 seguidores en los primeros 90 días`,
      gancho: 'No necesitas una audiencia masiva para ganar dinero con tu blog. Necesitas la estrategia correcta.',
      tipo: 'inspiracional',
      potencial: 'alto',
      keywords: ['monetización', 'blog', 'ingresos'],
    },
  ]
}
