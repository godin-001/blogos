'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react'

const steps = [
  { id: 1, title: '¿Cómo te llamas?', desc: 'Tu nombre o como quieres que te llame el agente.' },
  { id: 2, title: '¿Cuál es tu nicho?', desc: 'El tema principal de tu blog.' },
  { id: 3, title: '¿Quién es tu lector ideal?', desc: 'Descríbelo brevemente.' },
  { id: 4, title: '¿Cuál es tu estilo de escritura?', desc: 'Elige el que más te representa.' },
  { id: 5, title: '¿Cuál es tu objetivo principal?', desc: 'Lo que quieres lograr con tu blog.' },
]

const niches = [
  'Negocios y Emprendimiento', 'Marketing Digital', 'Tecnología e IA',
  'Finanzas Personales', 'Salud y Bienestar', 'Desarrollo Personal',
  'Educación', 'Viajes', 'Cocina', 'Arte y Creatividad', 'Otro',
]

const styles = [
  { id: 'informal', label: 'Informal y cercano', emoji: '😊', desc: 'Como hablar con un amigo' },
  { id: 'profesional', label: 'Profesional', emoji: '💼', desc: 'Serio y con autoridad' },
  { id: 'narrativo', label: 'Narrativo y storytelling', emoji: '📖', desc: 'Historias que enganchan' },
  { id: 'analitico', label: 'Analítico y técnico', emoji: '🔬', desc: 'Datos y profundidad' },
]

const goals = [
  { id: 'trafico', label: 'Generar tráfico orgánico', emoji: '📈' },
  { id: 'marca', label: 'Construir mi marca personal', emoji: '⭐' },
  { id: 'monetizar', label: 'Monetizar mi contenido', emoji: '💰' },
  { id: 'clientes', label: 'Atraer clientes', emoji: '🤝' },
  { id: 'comunidad', label: 'Construir una comunidad', emoji: '👥' },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    name: '',
    niche: '',
    customNiche: '',
    audience: '',
    style: '',
    goal: '',
  })

  const progress = ((step - 1) / steps.length) * 100

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1)
    else {
      const profile = {
        name: data.name,
        niche: data.niche === 'Otro' ? data.customNiche : data.niche,
        audience: data.audience,
        style: data.style,
        goal: data.goal,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('blogos_profile', JSON.stringify(profile))
      router.push('/')
    }
  }

  const handleBack = () => { if (step > 1) setStep(step - 1) }

  const canContinue = () => {
    if (step === 1) return data.name.trim().length > 1
    if (step === 2) return data.niche && (data.niche !== 'Otro' || data.customNiche.trim())
    if (step === 3) return data.audience.trim().length > 5
    if (step === 4) return data.style
    if (step === 5) return data.goal
    return true
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'var(--bg-base)'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <Sparkles size={26} color="white" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800 }} className="gradient-text">BlogOS</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Agente Founder de Blogs
        </div>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: '32px' }}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paso {step} de {steps.length}</span>
            <span style={{ fontSize: 12, color: '#a78bfa' }}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="animate-fade-in" key={step}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            {steps[step - 1].title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {steps[step - 1].desc}
          </p>

          {/* Step 1 — Name */}
          {step === 1 && (
            <input
              className="input-field"
              placeholder="Ej: Carlos, María, Coach Ana..."
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && canContinue() && handleNext()}
              autoFocus
            />
          )}

          {/* Step 2 — Niche */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {niches.map(n => (
                  <button
                    key={n}
                    onClick={() => setData({ ...data, niche: n })}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13,
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                      background: data.niche === n ? 'rgba(124,58,237,0.2)' : 'var(--bg-base)',
                      border: data.niche === n ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                      color: data.niche === n ? '#a78bfa' : 'var(--text-muted)',
                      fontWeight: data.niche === n ? 600 : 400,
                    }}
                  >
                    {data.niche === n && <Check size={12} style={{ marginRight: 6, display: 'inline' }} />}
                    {n}
                  </button>
                ))}
              </div>
              {data.niche === 'Otro' && (
                <input
                  className="input-field"
                  placeholder="Describe tu nicho..."
                  value={data.customNiche}
                  onChange={e => setData({ ...data, customNiche: e.target.value })}
                  autoFocus
                  style={{ marginTop: 4 }}
                />
              )}
            </div>
          )}

          {/* Step 3 — Audience */}
          {step === 3 && (
            <textarea
              className="textarea-field"
              placeholder="Ej: Emprendedores latinoamericanos de 25-40 años que quieren escalar su negocio online..."
              value={data.audience}
              onChange={e => setData({ ...data, audience: e.target.value })}
              autoFocus
              style={{ minHeight: 100 }}
            />
          )}

          {/* Step 4 — Style */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setData({ ...data, style: s.id })}
                  style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                    background: data.style === s.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                    border: data.style === s.id ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: data.style === s.id ? '#a78bfa' : 'var(--text)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  {data.style === s.id && (
                    <Check size={16} color="#a78bfa" style={{ marginLeft: 'auto' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 5 — Goal */}
          {step === 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {goals.map(g => (
                <button
                  key={g.id}
                  onClick={() => setData({ ...data, goal: g.id })}
                  style={{
                    padding: '16px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: data.goal === g.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                    border: data.goal === g.id ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                  <div style={{
                    fontSize: 12, fontWeight: 600, textAlign: 'center',
                    color: data.goal === g.id ? '#a78bfa' : 'var(--text-muted)'
                  }}>
                    {g.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            className="btn-secondary"
            onClick={handleBack}
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
          >
            <ArrowLeft size={16} style={{ marginRight: 6, display: 'inline' }} />
            Atrás
          </button>
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={!canContinue()}
            style={{ opacity: canContinue() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {step === steps.length ? (
              <>
                <Sparkles size={16} />
                ¡Comenzar!
              </>
            ) : (
              <>
                Continuar
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
        Puedes cambiar esto en cualquier momento desde tu perfil
      </p>
    </div>
  )
}
