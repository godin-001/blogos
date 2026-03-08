'use client'

import { useState } from 'react'
import { Network, Loader2, Plus, Trash2 } from 'lucide-react'
import { callChat, getProfile } from '@/lib/api'

interface ClusterData {
  pillar: { titulo: string; keyword: string; intencion: string; palabras: string }
  subtemas: Array<{ titulo: string; keyword: string; angulo: string; linkInterno: string }>
  estrategia: string
  frecuencia: string
}

const MOCK: (topico: string) => ClusterData = (topico) => ({
  pillar: {
    titulo:    `Guía definitiva: ${topico} para emprendedores LATAM`,
    keyword:   topico.toLowerCase(),
    intencion: 'informacional',
    palabras:  '2500-3500',
  },
  subtemas: [
    { titulo: `¿Qué es ${topico}? Explicado sin tecnicismos`,                        keyword: `${topico} qué es`,                  angulo: 'Para principiantes absolutos',                               linkInterno: 'Sección: Fundamentos' },
    { titulo: `Cómo empezar con ${topico} en 7 días (sin experiencia previa)`,       keyword: `cómo empezar ${topico}`,             angulo: 'Plan de acción paso a paso',                                 linkInterno: 'Sección: Primeros pasos' },
    { titulo: `Los 5 errores de ${topico} que destruyen tu tráfico`,                 keyword: `errores ${topico}`,                  angulo: 'Perspectiva negativa-positiva: qué NO hacer',                linkInterno: 'Sección: Errores comunes' },
    { titulo: `Herramientas de ${topico}: cuál usar según tu presupuesto`,           keyword: `herramientas ${topico}`,             angulo: 'Comparativa por precio y funcionalidad',                     linkInterno: 'Sección: Herramientas' },
    { titulo: `Casos reales: bloggers que dominaron ${topico} desde cero`,           keyword: `casos de éxito ${topico}`,           angulo: 'Historias reales con números y resultados',                  linkInterno: 'Sección: Casos de estudio' },
    { titulo: `${topico} avanzado: estrategias para escalar resultados x10`,         keyword: `${topico} avanzado estrategias`,     angulo: 'Para quien ya tiene bases y quiere multiplicar',             linkInterno: 'Sección: Estrategia avanzada' },
  ],
  estrategia: `Publica primero el artículo pilar, luego los 6 clusters en orden de profundidad. Cada cluster enlaza internamente al pilar y a 2 clusters relacionados. Google ve la red y te posiciona como autoridad del nicho.`,
  frecuencia: `Semana 1: artículo pilar. Semanas 2-4: 2 clusters/semana. Cluster completo en 4 semanas.`,
})

export default function ClustersPage() {
  const [topico, setTopico]   = useState('')
  const [nivel, setNivel]     = useState('intermedio')
  const [loading, setLoading] = useState(false)
  const [cluster, setCluster] = useState<ClusterData | null>(null)
  const [saved, setSaved]     = useState<ClusterData[]>(() => {
    if (typeof window === 'undefined') return []
    const s = localStorage.getItem('blogos_clusters')
    return s ? JSON.parse(s) : []
  })

  async function generar() {
    if (!topico.trim()) return
    setLoading(true)
    setCluster(null)
    const profile = getProfile()

    const promptText = `Eres un estratega de contenido. Diseña una arquitectura de Topic Cluster para "${topico}".
Audiencia: ${profile?.audience || 'emprendedores LATAM'}
Nicho: ${profile?.niche || 'Marketing digital'}
Nivel: ${nivel}

Responde SOLO en JSON sin markdown:
{"pillar":{"titulo":"","keyword":"","intencion":"informacional","palabras":"2500-3500"},"subtemas":[{"titulo":"","keyword":"","angulo":"","linkInterno":""}],"estrategia":"","frecuencia":""}

Genera exactamente 6 subtemas específicos con intención de búsqueda clara.`

    try {
      const res  = await callChat({ messages: [{ role: 'user', content: promptText }], profile })
      const raw  = (res as { text?: string }).text || ''
      const match = raw.match(/\{[\s\S]*\}/)
      const json  = match ? JSON.parse(match[0]) : null
      if (json?.pillar && Array.isArray(json.subtemas)) setCluster(json)
      else throw new Error('bad json')
    } catch {
      setCluster(MOCK(topico))
    } finally {
      setLoading(false)
    }
  }

  function guardar() {
    if (!cluster) return
    const updated = [cluster, ...saved].slice(0, 10)
    setSaved(updated)
    localStorage.setItem('blogos_clusters', JSON.stringify(updated))
  }

  function eliminar(i: number) {
    const updated = saved.filter((_, idx) => idx !== i)
    setSaved(updated)
    localStorage.setItem('blogos_clusters', JSON.stringify(updated))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Network size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Topic Clusters</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Arquitectura de contenido que domina nichos completos en Google</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '🏛️', title: 'Artículo Pilar',     desc: 'El hub principal que cubre el tema a fondo (2500+ palabras)' },
          { icon: '🔗', title: '6 Artículos Cluster', desc: 'Subtemas específicos que enlazan al pilar desde distintos ángulos' },
          { icon: '📈', title: 'Autoridad total',     desc: 'Google ve el conjunto y te posiciona como referente del nicho' },
        ].map(item => (
          <div key={item.title} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TEMA PRINCIPAL *</label>
            <input className="input" value={topico} onChange={e => setTopico(e.target.value)}
              placeholder="Ej: email marketing, productividad, finanzas personales"
              onKeyDown={e => e.key === 'Enter' && generar()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>NIVEL DE PROFUNDIDAD</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['principiante', 'intermedio', 'avanzado'].map(l => (
                <button key={l} onClick={() => setNivel(l)} style={{
                  padding: '6px 16px', borderRadius: 8, border: '1px solid',
                  borderColor: nivel === l ? '#7c3aed' : 'var(--border)',
                  background: nivel === l ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: nivel === l ? '#a78bfa' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 13, fontWeight: nivel === l ? 600 : 400, textTransform: 'capitalize',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={generar}
            disabled={loading || !topico.trim()} style={{ alignSelf: 'flex-start' }}>
            {loading ? <><Loader2 size={16} className="spin" /> Diseñando arquitectura...</> : '🏗️ Generar Topic Cluster'}
          </button>
        </div>
      </div>

      {/* Result */}
      {cluster && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pillar */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.05))',
            border: '1px solid rgba(6,182,212,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                background: '#06b6d4', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Artículo Pilar 🏛️</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cluster.pillar.palabras} palabras · {cluster.pillar.intencion}</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>{cluster.pillar.titulo}</h3>
            <span style={{
              display: 'inline-block', fontSize: 12, padding: '3px 10px',
              background: 'rgba(6,182,212,0.15)', borderRadius: 6, color: '#06b6d4',
            }}>🔑 {cluster.pillar.keyword}</span>
          </div>

          {/* Subtemas */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Artículos Cluster <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(enlazados al pilar)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cluster.subtemas.map((s, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{s.titulo}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#a78bfa' }}>🔑 {s.keyword}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· 🎯 {s.angulo}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 4 }}>🔗 Enlaza a: {s.linkInterno}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estrategia */}
          <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              📋 Estrategia de publicación
            </div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: '0 0 8px' }}>{cluster.estrategia}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>⏰ {cluster.frecuencia}</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={guardar}><Plus size={14} /> Guardar cluster</button>
            <a href="/calendario" className="btn btn-secondary" style={{ textDecoration: 'none' }}>📅 Agendar en calendario →</a>
          </div>
        </div>
      )}

      {/* Saved */}
      {saved.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Clusters guardados ({saved.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saved.map((c, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🏛️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.pillar.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.subtemas.length} artículos cluster</div>
                </div>
                <button onClick={() => setCluster(c)} style={{ fontSize: 11, color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer' }}>Ver →</button>
                <button onClick={() => eliminar(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
