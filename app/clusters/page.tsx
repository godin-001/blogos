'use client'
import { useState, useEffect } from 'react'

interface ClusterArticle {
  id: string; title: string; keyword: string; status: 'pendiente'|'borrador'|'publicado'; type: string
}
interface Pillar {
  id: string; title: string; keyword: string; description: string
  clusters: ClusterArticle[]
}

const TYPES = ['Evergreen','Tutorial','Storytelling','Contrarian','Trending','Pillar']
const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  color: '#64748b', bg: 'rgba(100,116,139,.15)' },
  borrador:   { label: 'Borrador',   color: '#f59e0b', bg: 'rgba(245,158,11,.15)'  },
  publicado:  { label: 'Publicado',  color: '#10b981', bg: 'rgba(16,185,129,.15)'  },
}

const STORAGE_KEY = 'blogos_clusters'

export default function ClustersPage() {
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [expanded, setExpanded] = useState<string|null>(null)
  const [showNewPillar, setShowNewPillar] = useState(false)
  const [newPillar, setNewPillar] = useState({ title: '', keyword: '', description: '' })
  const [newArticles, setNewArticles] = useState<Record<string, { title: string; keyword: string; type: string }>>({})

  useEffect(() => {
    const d = localStorage.getItem(STORAGE_KEY)
    if (d) setPillars(JSON.parse(d))
  }, [])

  const save = (p: Pillar[]) => {
    setPillars(p)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }

  const addPillar = () => {
    if (!newPillar.title) return
    const p: Pillar = {
      id: Date.now().toString(),
      ...newPillar,
      clusters: [],
    }
    save([...pillars, p])
    setNewPillar({ title: '', keyword: '', description: '' })
    setShowNewPillar(false)
    setExpanded(p.id)
  }

  const addArticle = (pillarId: string) => {
    const na = newArticles[pillarId]
    if (!na?.title) return
    const art: ClusterArticle = {
      id: Date.now().toString(),
      title: na.title, keyword: na.keyword || '', type: na.type || 'Evergreen', status: 'pendiente',
    }
    const updated = pillars.map(p => p.id === pillarId ? { ...p, clusters: [...p.clusters, art] } : p)
    save(updated)
    setNewArticles(prev => ({ ...prev, [pillarId]: { title: '', keyword: '', type: 'Evergreen' } }))
  }

  const updateStatus = (pillarId: string, artId: string, status: ClusterArticle['status']) => {
    const updated = pillars.map(p =>
      p.id !== pillarId ? p : {
        ...p, clusters: p.clusters.map(a => a.id === artId ? { ...a, status } : a),
      }
    )
    save(updated)
  }

  const deletePillar = (id: string) => save(pillars.filter(p => p.id !== id))
  const deleteArticle = (pId: string, aId: string) => {
    save(pillars.map(p => p.id !== pId ? p : { ...p, clusters: p.clusters.filter(a => a.id !== aId) }))
  }

  const totalPublished = pillars.reduce((acc, p) => acc + p.clusters.filter(a => a.status === 'publicado').length, 0)
  const totalArticles  = pillars.reduce((acc, p) => acc + p.clusters.length, 0)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🕸 Topic Clusters</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Arquitectura de autoridad: Pillar Pages (3000-5000 palabras) + 10-15 artículos cluster. Domina temas enteros, no keywords aisladas.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pillar Pages', val: pillars.length, color: '#7c3aed' },
          { label: 'Total artículos', val: totalArticles, color: '#06b6d4' },
          { label: 'Publicados', val: totalPublished, color: '#10b981' },
          { label: 'Completado', val: totalArticles ? `${Math.round(totalPublished/totalArticles*100)}%` : '0%', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '16px', borderRadius: 12, background: 'var(--bg-card)',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New pillar */}
      <button onClick={() => setShowNewPillar(!showNewPillar)}
        style={{
          marginBottom: 20, padding: '10px 20px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: 'white',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
        + Nueva Pillar Page
      </button>

      {showNewPillar && (
        <div style={{
          padding: 20, borderRadius: 14, background: 'var(--bg-card)',
          border: '1px solid #7c3aed44', marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Título de la Pillar Page *"
              value={newPillar.title} onChange={e => setNewPillar(p => ({ ...p, title: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }} />
            <input placeholder="Keyword principal"
              value={newPillar.keyword} onChange={e => setNewPillar(p => ({ ...p, keyword: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }} />
          </div>
          <input placeholder="Descripción del tema que cubre esta pillar page"
            value={newPillar.description} onChange={e => setNewPillar(p => ({ ...p, description: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addPillar}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Crear Pillar Page
            </button>
            <button onClick={() => setShowNewPillar(false)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Pillars */}
      {pillars.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕸</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin clusters todavía</div>
          <div style={{ fontSize: 14 }}>Crea tu primera Pillar Page y agrega 10-15 artículos cluster debajo.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pillars.map(p => {
            const pubs = p.clusters.filter(a => a.status === 'publicado').length
            const pct  = p.clusters.length ? Math.round(pubs / p.clusters.length * 100) : 0
            return (
              <div key={p.id} style={{ borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Pillar header */}
                <div
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  style={{
                    padding: '18px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    borderBottom: expanded === p.id ? '1px solid var(--border)' : 'none',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(124,58,237,.2)', color: '#a78bfa',
                      }}>PILLAR</span>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
                    </div>
                    {p.keyword && <div style={{ fontSize: 12, color: '#7c3aed' }}>🔑 {p.keyword}</div>}
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{p.description}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {pubs}/{p.clusters.length} publicados
                    </div>
                    <div style={{ width: 100, height: 6, borderRadius: 3, background: 'var(--border)' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }} />
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{expanded === p.id ? '▲' : '▼'}</span>
                  <button onClick={e => { e.stopPropagation(); deletePillar(p.id) }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                </div>

                {expanded === p.id && (
                  <div style={{ padding: 20 }}>
                    {/* Articles list */}
                    {p.clusters.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                          {a.keyword && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>🔑 {a.keyword}</div>}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4 }}>{a.type}</span>
                        <select value={a.status}
                          onChange={e => updateStatus(p.id, a.id, e.target.value as ClusterArticle['status'])}
                          style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: STATUSES[a.status].bg, color: STATUSES[a.status].color,
                          }}>
                          {Object.entries(STATUSES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                        </select>
                        <button onClick={() => deleteArticle(p.id, a.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                      </div>
                    ))}

                    {/* Add article form */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <input placeholder="Título del artículo cluster *"
                        value={newArticles[p.id]?.title || ''}
                        onChange={e => setNewArticles(prev => ({ ...prev, [p.id]: { ...prev[p.id], title: e.target.value } }))}
                        style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
                      <input placeholder="Keyword"
                        value={newArticles[p.id]?.keyword || ''}
                        onChange={e => setNewArticles(prev => ({ ...prev, [p.id]: { ...prev[p.id], keyword: e.target.value } }))}
                        style={{ width: 140, padding: '9px 12px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
                      <select value={newArticles[p.id]?.type || 'Evergreen'}
                        onChange={e => setNewArticles(prev => ({ ...prev, [p.id]: { ...prev[p.id], type: e.target.value } }))}
                        style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button onClick={() => addArticle(p.id)}
                        style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        + Agregar
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      Meta: 10-15 artículos por pillar para dominar el tema completo.
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
