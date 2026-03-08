'use client'
import { useState, useEffect } from 'react'

interface Metric { date: string; visits: number; subs: number; revenue: number; articles: number }
interface Experiment { id: string; date: string; hypothesis: string; result: string; winner: boolean; impact: string }

const STORAGE_KEY_M = 'blogos_metrics'
const STORAGE_KEY_E = 'blogos_experiments'

const KPIS = [
  { month: 'Mes 1-2', visits: 0,     subs: 100,   rev: 0,    note: 'Base: 10 artículos fundacionales' },
  { month: 'Mes 3',   visits: 1500,  subs: 300,   rev: 100,  note: 'Primeros ingresos por afiliados' },
  { month: 'Mes 6',   visits: 5000,  subs: 1000,  rev: 500,  note: 'Producto propio o membresía' },
  { month: 'Mes 12',  visits: 15000, subs: 3000,  rev: 2000, note: 'Autoridad en el nicho' },
  { month: 'Mes 24',  visits: 50000, subs: 10000, rev: 5000, note: 'Imperio LATAM' },
]

export default function GrowthPage() {
  const [metrics, setMetrics]         = useState<Metric[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [tab, setTab]                 = useState<'metrics'|'experiments'|'kpis'>('metrics')
  const [newM, setNewM]               = useState<Metric>({ date: new Date().toISOString().slice(0,7), visits: 0, subs: 0, revenue: 0, articles: 0 })
  const [newE, setNewE]               = useState<Omit<Experiment,'id'|'date'>>({ hypothesis: '', result: '', winner: false, impact: '' })

  useEffect(() => {
    const m = localStorage.getItem(STORAGE_KEY_M)
    const e = localStorage.getItem(STORAGE_KEY_E)
    if (m) setMetrics(JSON.parse(m))
    if (e) setExperiments(JSON.parse(e))
  }, [])

  const saveM = (d: Metric[]) => { setMetrics(d); localStorage.setItem(STORAGE_KEY_M, JSON.stringify(d)) }
  const saveE = (d: Experiment[]) => { setExperiments(d); localStorage.setItem(STORAGE_KEY_E, JSON.stringify(d)) }

  const addMetric = () => {
    saveM([...metrics, newM].sort((a,b) => a.date.localeCompare(b.date)))
    setNewM({ date: new Date().toISOString().slice(0,7), visits: 0, subs: 0, revenue: 0, articles: 0 })
  }

  const addExperiment = () => {
    if (!newE.hypothesis) return
    saveE([{ id: Date.now().toString(), date: new Date().toLocaleDateString('es-MX'), ...newE }, ...experiments])
    setNewE({ hypothesis: '', result: '', winner: false, impact: '' })
  }

  const last = metrics[metrics.length - 1]
  const prev = metrics[metrics.length - 2]
  const growth = (cur: number, pre: number) => pre > 0 ? ((cur-pre)/pre*100).toFixed(0) : '—'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📊 Growth Log</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Lo que no se mide no mejora. Registra métricas mensuales, documenta experimentos y compara tu progreso con los KPIs del framework APEX.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'metrics', label: '📈 Métricas' },
          { id: 'experiments', label: '🧪 Experimentos' },
          { id: 'kpis', label: '🎯 KPIs APEX' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            style={{
              padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none',
              background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'var(--bg-card)',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* METRICS */}
      {tab === 'metrics' && (
        <div>
          {/* Summary cards */}
          {last && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Visitas/mes', val: last.visits.toLocaleString(), delta: prev ? `${growth(last.visits,prev.visits)}%` : null, color: '#7c3aed' },
                { label: 'Suscriptores', val: last.subs.toLocaleString(), delta: prev ? `${growth(last.subs,prev.subs)}%` : null, color: '#06b6d4' },
                { label: 'Ingresos/mes', val: `$${last.revenue}`, delta: prev ? `${growth(last.revenue,prev.revenue)}%` : null, color: '#10b981' },
                { label: 'Artículos tot.', val: last.articles, delta: null, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: 16, borderRadius: 12, background: 'var(--bg-card)',
                  border: '1px solid var(--border)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</div>
                  {s.delta && <div style={{ fontSize: 12, color: s.delta.startsWith('-') ? '#ef4444' : '#10b981', fontWeight: 700 }}>{s.delta.startsWith('-') ? '↓' : '↑'} {s.delta}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Add metric */}
          <div style={{
            padding: 18, borderRadius: 14, background: 'var(--bg-card)',
            border: '1px solid var(--border)', marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>+ Registrar métricas del mes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { key: 'date', label: 'Mes', type: 'month', step: undefined },
                { key: 'visits', label: 'Visitas', type: 'number', step: 100 },
                { key: 'subs', label: 'Suscriptores', type: 'number', step: 10 },
                { key: 'revenue', label: 'Ingresos $', type: 'number', step: 10 },
                { key: 'articles', label: 'Artículos totales', type: 'number', step: 1 },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label.toUpperCase()}</label>
                  <input type={f.type} step={f.step}
                    value={(newM as any)[f.key]}
                    onChange={e => setNewM(p => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
                </div>
              ))}
            </div>
            <button onClick={addMetric}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Guardar mes
            </button>
          </div>

          {/* History */}
          {metrics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
              <div>Registra tu primer mes de métricas arriba.</div>
            </div>
          ) : (
            <div style={{ borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)' }}>
                    {['Mes','Visitas','Suscriptores','Ingresos','Artículos',''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].reverse().map((m, i) => (
                    <tr key={m.date} style={{ borderBottom: '1px solid var(--border)', opacity: 1 }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{m.date}</td>
                      <td style={{ padding: '10px 14px', color: '#7c3aed', fontWeight: 600 }}>{m.visits.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: '#06b6d4', fontWeight: 600 }}>{m.subs.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>${m.revenue}</td>
                      <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: 600 }}>{m.articles}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => saveM(metrics.filter(x => x.date !== m.date))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EXPERIMENTS */}
      {tab === 'experiments' && (
        <div>
          <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>+ Documentar experimento</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Hipótesis: 'Si cambio el título a X, el CTR aumentará porque...'"
                value={newE.hypothesis} onChange={e => setNewE(p => ({ ...p, hypothesis: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
              <input placeholder="Resultado obtenido (con números)"
                value={newE.result} onChange={e => setNewE(p => ({ ...p, result: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Impacto o aprendizaje principal"
                  value={newE.impact} onChange={e => setNewE(p => ({ ...p, impact: e.target.value }))}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newE.winner} onChange={e => setNewE(p => ({ ...p, winner: e.target.checked }))} />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Ganador</span>
                </label>
              </div>
              <button onClick={addExperiment}
                style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Guardar experimento
              </button>
            </div>
          </div>

          {experiments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🧪</div>
              <div>Documenta tus primeros experimentos. El Growth Log es tu ventaja competitiva.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {experiments.map(e => (
                <div key={e.id} style={{
                  padding: '16px 18px', borderRadius: 12, background: 'var(--bg-card)',
                  border: `1px solid ${e.winner ? 'rgba(16,185,129,.4)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {e.winner && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,.15)', padding: '2px 8px', borderRadius: 4 }}>✅ GANADOR</span>}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.date}</span>
                    </div>
                    <button onClick={() => saveE(experiments.filter(x => x.id !== e.id))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🔬 {e.hypothesis}</div>
                  {e.result && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>📊 {e.result}</div>}
                  {e.impact && <div style={{ fontSize: 13, color: '#a78bfa' }}>💡 {e.impact}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      {tab === 'kpis' && (
        <div>
          <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', fontSize: 13, color: '#a78bfa' }}>
            📌 Referencia del <strong>framework APEX</strong>. Compara estos KPIs con tus métricas reales para saber si estás en el ritmo correcto.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {KPIS.map((k, i) => {
              const myVisits = last?.visits || 0
              const pct = k.visits > 0 ? Math.min(100, Math.round(myVisits / k.visits * 100)) : (last?.subs && last.subs >= k.subs ? 100 : 0)
              return (
                <div key={k.month} style={{
                  padding: '18px 20px', borderRadius: 14, background: 'var(--bg-card)',
                  border: `1px solid ${pct >= 100 ? 'rgba(16,185,129,.4)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k.month}</span>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{k.note}</div>
                    </div>
                    {pct >= 100 && <span style={{ fontSize: 20 }}>✅</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'Visitas/mes', target: k.visits ? k.visits.toLocaleString() : '—', color: '#7c3aed' },
                      { label: 'Suscriptores', target: k.subs.toLocaleString(), color: '#06b6d4' },
                      { label: 'Ingresos/mes', target: k.rev > 0 ? `$${k.rev}` : '—', color: '#10b981' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.target}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
