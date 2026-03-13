'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Plus, Trash2, TrendingUp, TrendingDown, Minus, CheckCircle, Clock, XCircle, Loader2, Edit3 } from 'lucide-react'
import { callChat, getProfile } from '@/lib/api'

type Impacto  = 'positivo' | 'negativo' | 'neutral' | 'pendiente'
type Estado   = 'activo' | 'completado' | 'cancelado'
type Categoria= 'seo' | 'contenido' | 'distribucion' | 'monetizacion' | 'crecimiento' | 'otro'

interface Experimento {
  id: string; fecha: string; hipotesis: string; accion: string; metrica: string
  resultado: string; antes: string; despues: string; estado: Estado
  impacto: Impacto; aprendizaje: string; categoria: Categoria
}

const CATS = [
  { id: 'seo',          label: 'SEO',          color: '#10b981', icon: '🔍' },
  { id: 'contenido',    label: 'Contenido',    color: '#7c3aed', icon: '✍️' },
  { id: 'distribucion', label: 'Distribución', color: '#06b6d4', icon: '📡' },
  { id: 'monetizacion', label: 'Monetización', color: '#f59e0b', icon: '💰' },
  { id: 'crecimiento',  label: 'Crecimiento',  color: '#ef4444', icon: '🚀' },
  { id: 'otro',         label: 'Otro',         color: '#6b7280', icon: '⚙️' },
]
const IMPACTOS = [
  { id: 'positivo', label: 'Positivo', Icon: TrendingUp,  color: '#10b981' },
  { id: 'negativo', label: 'Negativo', Icon: TrendingDown, color: '#ef4444' },
  { id: 'neutral',  label: 'Neutral',  Icon: Minus,       color: '#6b7280' },
  { id: 'pendiente',label: 'Pendiente',Icon: Clock,       color: '#f59e0b' },
]
const ESTADOS = [
  { id: 'activo',     label: 'Activo',     Icon: Clock,       color: '#f59e0b' },
  { id: 'completado', label: 'Completado', Icon: CheckCircle, color: '#10b981' },
  { id: 'cancelado',  label: 'Cancelado',  Icon: XCircle,     color: '#6b7280' },
]

const EMPTY: Omit<Experimento, 'id' | 'fecha'> = {
  hipotesis: '', accion: '', metrica: '', resultado: '', antes: '', despues: '',
  estado: 'activo', impacto: 'pendiente', aprendizaje: '', categoria: 'contenido',
}

export default function GrowthPage() {
  const [exps, setExps]           = useState<Experimento[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<Omit<Experimento, 'id' | 'fecha'>>(EMPTY)
  const [filter, setFilter]       = useState('todos')
  const [loadingIA, setLoadingIA] = useState(false)
  const [insight, setInsight]     = useState('')
  // Inline complete modal state
  const [completing, setCompleting]   = useState<string | null>(null)
  const [aprendizajeText, setAprendizajeText] = useState('')

  useEffect(() => {
    const s = localStorage.getItem('blogos_growth')
    if (s) setExps(JSON.parse(s))
  }, [])

  function persist(updated: Experimento[]) {
    setExps(updated)
    localStorage.setItem('blogos_growth', JSON.stringify(updated))
  }

  function agregar() {
    if (!form.hipotesis.trim() || !form.accion.trim()) return
    persist([{ ...form, id: Date.now().toString(), fecha: new Date().toISOString().split('T')[0] }, ...exps])
    setForm(EMPTY)
    setShowForm(false)
  }

  function update(id: string, changes: Partial<Experimento>) {
    persist(exps.map(e => e.id === id ? { ...e, ...changes } : e))
  }

  function completar(id: string) {
    update(id, { estado: 'completado', aprendizaje: aprendizajeText })
    setCompleting(null)
    setAprendizajeText('')
  }

  async function generarInsight() {
    const completados = exps.filter(e => e.estado === 'completado').slice(0, 8)
    if (completados.length < 2) return
    setLoadingIA(true)
    setInsight('')
    const profile = getProfile()

    const promptText = `Eres un growth strategist experto en blogs. Analiza estos experimentos y da un insight accionable.
NICHO: ${profile?.niche || 'Marketing digital'}

EXPERIMENTOS COMPLETADOS:
${completados.map(e => `• ${e.hipotesis} → ${e.impacto} | Aprendizaje: ${e.aprendizaje || 'sin registrar'} | Cat: ${e.categoria}`).join('\n')}

Da:
1. El patrón más importante en sus experimentos exitosos
2. El experimento de mayor potencial que debería hacer AHORA
3. Un punto ciego que parece estar ignorando

Responde en texto directo, máximo 4-5 oraciones. Como mentor que conoce el negocio.`

    try {
      const res = await callChat({ messages: [{ role: 'user', content: promptText }], profile })
      setInsight((res as { text?: string }).text || '')
    } catch {
      const positivos = completados.filter(e => e.impacto === 'positivo').length
      setInsight(`Has completado ${completados.length} experimentos con ${positivos} exitosos (${Math.round(positivos / completados.length * 100)}% de éxito). Tu área de mayor experimentación muestra tus fortalezas. Próximo paso recomendado: diseña una serie de 3 experimentos de distribución en los próximos 30 días — es el área más subestimada para bloggers de tu nivel. Punto ciego: la consistencia de publicación supera a la perfección de cada artículo.`)
    } finally {
      setLoadingIA(false)
    }
  }

  const filtered = filter === 'todos' ? exps
    : filter === 'activo' || filter === 'completado' ? exps.filter(e => e.estado === filter)
    : exps.filter(e => e.categoria === filter)

  const stats = {
    total: exps.length, activos: exps.filter(e => e.estado === 'activo').length,
    completados: exps.filter(e => e.estado === 'completado').length,
    exitosos: exps.filter(e => e.impacto === 'positivo').length,
  }

  return (
    <div>
      {/* Completing modal */}
      {completing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>✅ Completar experimento</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>¿Qué aprendiste? (opcional pero muy valioso para futuros insights)</p>
            <textarea className="textarea" value={aprendizajeText}
              onChange={e => setAprendizajeText(e.target.value)}
              placeholder="Ej: Publicar 3x por semana sí aumentó el tráfico pero la calidad bajó — mejor 2x con más profundidad"
              rows={3} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => completar(completing)}>Guardar y completar</button>
              <button className="btn btn-secondary" onClick={() => { setCompleting(null); setAprendizajeText('') }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Growth Log</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Registra experimentos, mide resultados, aprende más rápido</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {exps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total',      value: stats.total,      icon: '🧪', color: '#7c3aed' },
            { label: 'Activos',    value: stats.activos,    icon: '⚡', color: '#f59e0b' },
            { label: 'Completados',value: stats.completados, icon: '✅', color: '#10b981' },
            { label: 'Exitosos',   value: stats.exitosos,   icon: '🚀', color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insight */}
      {exps.filter(e => e.estado === 'completado').length >= 2 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))',
          border: '1px solid rgba(124,58,237,0.2)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: insight ? 12 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Insight AI de tus experimentos</span>
            </div>
            <button className="btn btn-secondary" onClick={generarInsight} disabled={loadingIA}
              style={{ fontSize: 12, padding: '6px 12px' }}>
              {loadingIA ? <><Loader2 size={12} className="spin" /> Analizando...</> : '✨ Generar insight'}
            </button>
          </div>
          {insight && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{insight}</p>}
        </div>
      )}

      {/* Filters + Add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ id: 'todos', label: 'Todos' }, { id: 'activo', label: 'Activos' }, { id: 'completado', label: 'Completados' }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid', cursor: 'pointer',
            borderColor: filter === f.id ? '#7c3aed' : 'var(--border)',
            background: filter === f.id ? 'rgba(124,58,237,0.15)' : 'transparent',
            color: filter === f.id ? '#a78bfa' : 'var(--text-muted)',
          }}>{f.label}</button>
        ))}
        {CATS.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid', cursor: 'pointer',
            borderColor: filter === c.id ? c.color : 'var(--border)',
            background: filter === c.id ? `${c.color}15` : 'transparent',
            color: filter === c.id ? c.color : 'var(--text-muted)',
          }}>{c.icon} {c.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: '6px 14px' }}>
          <Plus size={14} /> Nuevo experimento
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(124,58,237,0.3)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>🧪 Nuevo experimento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                HIPÓTESIS * — &ldquo;Si hago X, entonces Y porque Z&rdquo;
              </label>
              <input className="input" value={form.hipotesis} onChange={e => setForm({ ...form, hipotesis: e.target.value })}
                placeholder="Si publico 3x/semana, el tráfico aumentará 20% porque más contenido = más keywords" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ACCIÓN CONCRETA *</label>
              <input className="input" value={form.accion} onChange={e => setForm({ ...form, accion: e.target.value })}
                placeholder="Publicar lunes, miércoles y viernes durante 30 días" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MÉTRICA</label>
                <input className="input" value={form.metrica} onChange={e => setForm({ ...form, metrica: e.target.value })}
                  placeholder="Sesiones mensuales en GA4" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
                <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Categoria })}>
                  {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={agregar} disabled={!form.hipotesis.trim() || !form.accion.trim()}>
              <Plus size={14} /> Agregar
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {exps.length === 0 ? 'Tu Growth Log está vacío' : 'Sin experimentos en esta categoría'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {exps.length === 0
              ? 'Los bloggers de nivel mundial tratan su blog como un laboratorio. Cada cambio es un experimento con hipótesis y métricas.'
              : 'Prueba otro filtro o crea un experimento nuevo'}
          </p>
          {exps.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Crear primer experimento
            </button>
          )}
        </div>
      )}

      {/* Experiments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(exp => {
          const cat     = CATS.find(c => c.id === exp.categoria) || CATS[0]
          const estado  = ESTADOS.find(e => e.id === exp.estado)  || ESTADOS[0]
          const impacto = IMPACTOS.find(i => i.id === exp.impacto)|| IMPACTOS[3]
          const { Icon: ImpIcon } = impacto

          return (
            <div key={exp.id} className="card" style={{ borderLeft: `3px solid ${cat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${cat.color}20`, color: cat.color }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${estado.color}15`, color: estado.color }}>
                      {exp.estado}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exp.fecha}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.5 }}>{exp.hipotesis}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>→ {exp.accion}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <ImpIcon size={20} color={impacto.color} />
                  <span style={{ fontSize: 9, color: impacto.color, fontWeight: 700 }}>{impacto.label}</span>
                </div>
              </div>

              {(exp.antes || exp.despues || exp.resultado) && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.12)',
                  borderRadius: 8, display: 'flex', gap: 16, flexWrap: 'wrap',
                }}>
                  {exp.antes    && <div style={{ fontSize: 12 }}><span style={{ color: 'var(--text-muted)' }}>Antes: </span><span style={{ color: 'var(--text)', fontWeight: 600 }}>{exp.antes}</span></div>}
                  {exp.despues  && <div style={{ fontSize: 12 }}><span style={{ color: 'var(--text-muted)' }}>Después: </span><span style={{ color: '#10b981', fontWeight: 600 }}>{exp.despues}</span></div>}
                  {exp.resultado&& <div style={{ fontSize: 12 }}><span style={{ color: 'var(--text-muted)' }}>Resultado: </span><span style={{ color: 'var(--text)' }}>{exp.resultado}</span></div>}
                </div>
              )}

              {exp.aprendizaje && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  💡 {exp.aprendizaje}
                </div>
              )}

              {/* Controls */}
              {exp.estado === 'activo' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={exp.impacto}
                    onChange={e => update(exp.id, { impacto: e.target.value as Impacto })}
                    style={{
                      fontSize: 11, padding: '4px 8px', borderRadius: 6,
                      border: '1px solid var(--border)', background: 'var(--bg-card)',
                      color: 'var(--text)', cursor: 'pointer',
                    }}>
                    {IMPACTOS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                  </select>
                  <button onClick={() => { setCompleting(exp.id); setAprendizajeText(exp.aprendizaje) }} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  }}>
                    <Edit3 size={11} style={{ display: 'inline', marginRight: 4 }} />Completar
                  </button>
                  <button onClick={() => update(exp.id, { estado: 'cancelado' })} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    border: '1px solid rgba(107,114,128,0.3)', background: 'transparent', color: '#6b7280',
                  }}>Cancelar</button>
                  <button onClick={() => persist(exps.filter(e => e.id !== exp.id))} style={{
                    marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}><Trash2 size={13} /></button>
                </div>
              )}
              {exp.estado !== 'activo' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => persist(exps.filter(e => e.id !== exp.id))} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Methodology */}
      {exps.length === 0 && (
        <div className="card" style={{ marginTop: 24, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 12 }}>📖 Metodología: The Blog Lab</div>
          {[
            { n: 1, t: 'Formula una hipótesis', d: '"Si hago X, entonces Y porque Z" — específico y medible' },
            { n: 2, t: 'Define la métrica',     d: 'Una sola métrica principal que confirme o rechace la hipótesis' },
            { n: 3, t: 'Ejecuta 30 días',       d: 'Los experimentos necesitan tiempo para mostrar resultados reales' },
            { n: 4, t: 'Documenta el aprendizaje', d: 'Un fracaso bien documentado vale más que 10 éxitos sin registro' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#a78bfa',
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.t}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
