'use client'

import { useState, useEffect } from 'react'
import { Save, Check, Trash2, RotateCcw } from 'lucide-react'

const STYLES = [
  { id: 'informal', label: 'Informal y cercano', emoji: '😊' },
  { id: 'profesional', label: 'Profesional', emoji: '💼' },
  { id: 'narrativo', label: 'Narrativo / Storytelling', emoji: '📖' },
  { id: 'analitico', label: 'Analítico / Técnico', emoji: '🔬' },
]

const GOALS = [
  { id: 'trafico', label: 'Generar tráfico orgánico', emoji: '📈' },
  { id: 'marca', label: 'Construir marca personal', emoji: '⭐' },
  { id: 'monetizar', label: 'Monetizar contenido', emoji: '💰' },
  { id: 'clientes', label: 'Atraer clientes', emoji: '🤝' },
  { id: 'comunidad', label: 'Construir comunidad', emoji: '👥' },
]

const FREQUENCIES = [
  { id: '1', label: '1 artículo / semana', emoji: '🌱' },
  { id: '2-3', label: '2-3 artículos / semana', emoji: '🔥', recommended: true },
  { id: '5+', label: '5+ artículos / semana', emoji: '⚡' },
]

export default function PerfilPage() {
  const [profile, setProfile] = useState({
    name: '',
    niche: '',
    audience: '',
    style: '',
    goal: '',
    frequency: '2-3',
    bio: '',
    frutero: false,
  })
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ ideas: 0, articles: 0, calEntries: 0 })
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (saved) setProfile(JSON.parse(saved))
    const ideas = JSON.parse(localStorage.getItem('blogos_ideas') || '[]')
    const articles = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    const cal = JSON.parse(localStorage.getItem('blogos_calendar') || '[]')
    setStats({ ideas: ideas.length, articles: articles.length, calEntries: cal.length })
  }, [])

  const saveProfile = () => {
    localStorage.setItem('blogos_profile', JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetAll = () => {
    localStorage.clear()
    setConfirmReset(false)
    window.location.href = '/onboarding'
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>⚙️ Mi Perfil</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Personaliza tu agente para que te conozca y te dé sugerencias más relevantes
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Ideas guardadas', value: stats.ideas, emoji: '💡' },
          { label: 'Artículos creados', value: stats.articles, emoji: '📝' },
          { label: 'En calendario', value: stats.calEntries, emoji: '📅' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{s.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '4px 0' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic info */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>👤 Información básica</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tu nombre</label>
              <input className="input-field" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="¿Cómo te llamas?" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nicho del blog</label>
              <input className="input-field" value={profile.niche} onChange={e => setProfile(p => ({ ...p, niche: e.target.value }))} placeholder="Ej: Marketing Digital" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Lector ideal</label>
            <textarea className="textarea-field" value={profile.audience} onChange={e => setProfile(p => ({ ...p, audience: e.target.value }))} placeholder="Describe a tu audiencia objetivo..." style={{ minHeight: 80 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio del escritor (opcional)</label>
            <textarea className="textarea-field" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Un párrafo sobre ti, tu experiencia y lo que aportas al lector..." style={{ minHeight: 80 }} />
          </div>
        </div>

        {/* Style */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>✍️ Estilo de escritura</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {STYLES.map(s => (
              <button key={s.id} onClick={() => setProfile(p => ({ ...p, style: s.id }))} style={{
                padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: profile.style === s.id ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                background: profile.style === s.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <span style={{ fontSize: 13, color: profile.style === s.id ? '#a78bfa' : 'var(--text)', fontWeight: profile.style === s.id ? 600 : 400 }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>🎯 Objetivo principal</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setProfile(p => ({ ...p, goal: g.id }))} style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                border: profile.goal === g.id ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                background: profile.goal === g.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
              }}>
                <span>{g.emoji}</span>
                <span style={{ fontSize: 12, color: profile.goal === g.id ? '#a78bfa' : 'var(--text-muted)', fontWeight: profile.goal === g.id ? 600 : 400 }}>
                  {g.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>📅 Frecuencia de publicación</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {FREQUENCIES.map(f => (
              <button key={f.id} onClick={() => setProfile(p => ({ ...p, frequency: f.id }))} style={{
                flex: 1, padding: '14px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: profile.frequency === f.id ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                background: profile.frequency === f.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                transition: 'all 0.2s', position: 'relative'
              }}>
                {f.recommended && (
                  <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 9, padding: '1px 6px', background: '#7c3aed', color: 'white', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    RECOMENDADO
                  </div>
                )}
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.emoji}</div>
                <div style={{ fontSize: 12, color: profile.frequency === f.id ? '#a78bfa' : 'var(--text-muted)', fontWeight: profile.frequency === f.id ? 600 : 400 }}>
                  {f.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Frutero mode */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>🥭 Modo Frutero</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Activa sugerencias y contexto específico para equipos de Fruteros</p>
            </div>
            <button
              onClick={() => setProfile(p => ({ ...p, frutero: !p.frutero }))}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: profile.frutero ? '#7c3aed' : 'var(--border-light)',
                position: 'relative', transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3, transition: 'all 0.3s',
                left: profile.frutero ? 25 : 3
              }} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button
            className="btn-secondary"
            onClick={resetAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <RotateCcw size={15} />
            Reiniciar todo
          </button>
          <button
            className="btn-primary"
            onClick={saveProfile}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
