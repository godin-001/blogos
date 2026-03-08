'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, Pen, HelpCircle, TrendingUp, Calendar, DollarSign, ArrowRight, Zap, Target, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

const quickActions = [
  {
    href: '/ideas',
    icon: Lightbulb,
    title: 'Generar Ideas',
    desc: 'Obtén 10 ideas de artículos en segundos',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    href: '/articulo',
    icon: Pen,
    title: 'Nuevo Artículo',
    desc: 'Estructura y escribe con la metodología BlogOS',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.2)',
  },
  {
    href: '/preguntas',
    icon: HelpCircle,
    title: 'Sesión Reflexiva',
    desc: 'Profundiza tu pensamiento con preguntas clave',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.2)',
  },
  {
    href: '/seo',
    icon: TrendingUp,
    title: 'SEO & Copywriting',
    desc: 'Optimiza tu artículo para buscadores y lectores',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
  },
]

const tips = [
  '💡 Los mejores blogs responden una pregunta que el lector ni sabía que tenía.',
  '✍️ Escribe el primer borrador sin editar. Edita en la segunda pasada.',
  '🎯 Un título con número específico genera 36% más clics (ej: "7 formas de...").',
  '🔥 El gancho son tus primeras 2 oraciones. Si no enganchan, nadie sigue leyendo.',
  '📊 Publica consistente antes de publicar perfecto. La consistencia gana.',
  '💬 Los artículos de opinión tienen 3x más viralidad que los informativos.',
  '🚀 Un CTA claro al final duplica la tasa de conversión de lectores a suscriptores.',
]

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ name: string; niche: string } | null>(null)
  const [tip, setTip] = useState(tips[0])
  const [stats, setStats] = useState({ ideas: 0, articles: 0, week: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (!saved) {
      router.push('/onboarding')
      return
    }
    setProfile(JSON.parse(saved))

    const ideas = JSON.parse(localStorage.getItem('blogos_ideas') || '[]')
    const articles = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    setStats({ ideas: ideas.length, articles: articles.length, week: Math.min(articles.length, 3) })

    setTip(tips[Math.floor(Math.random() * tips.length)])
  }, [router])

  if (!profile) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 18 ? '¡Buenas tardes' : '¡Buenas noches'

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
          {greeting}, {profile.name}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 15 }}>
          Tu agente de blogs está listo. ¿Qué creamos hoy?
        </p>
      </div>

      {/* Tip del día */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 10,
        marginBottom: 28,
        display: 'flex', alignItems: 'flex-start', gap: 12
      }}>
        <Zap size={18} color="#a78bfa" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 3 }}>TIP DEL DÍA</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{tip}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Ideas guardadas', value: stats.ideas, icon: Lightbulb, color: '#f59e0b' },
          { label: 'Artículos creados', value: stats.articles, icon: BookOpen, color: '#7c3aed' },
          { label: 'Esta semana', value: `${stats.week}/3`, icon: Target, color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <s.icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
        Acciones rápidas
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{
              padding: '18px',
              border: `1px solid ${action.border}`,
              background: action.bg,
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <action.icon size={20} color={action.color} />
                <ArrowRight size={16} color={action.color} style={{ opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                {action.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {action.desc}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Progress weekly */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>🗓 Progreso semanal</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Meta: 2-3 artículos por semana</div>
          </div>
          <span className="badge badge-amber">{stats.week}/3</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${(stats.week / 3) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div key={day} style={{ textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < stats.week ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: i < stats.week ? 'white' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {i < stats.week ? '✓' : ''}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nicho */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        border: '1px solid var(--border)',
        borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Tu nicho: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.niche}</span>
        </div>
        <Link href="/perfil" style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none' }}>
          Editar →
        </Link>
      </div>
    </div>
  )
}
