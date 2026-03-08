'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Lightbulb, Pen, TrendingUp, ArrowRight,
  Zap, Star, Network, Anchor, Share2, BarChart2,
  Flame, BookOpen, Target, Sparkles, AlertCircle
} from 'lucide-react'

const TIPS = [
  '💡 Los mejores blogs responden una pregunta que el lector ni sabía que tenía.',
  '✍️ Escribe el primer borrador sin editar. Edita siempre en la segunda pasada.',
  '🎯 Un título con número específico genera 36% más clics.',
  '🔥 Tus primeras 2 oraciones deciden si alguien sigue leyendo.',
  '📊 La consistencia gana a la perfección. Publica 2x/semana.',
  '💬 Los artículos de opinión tienen 3x más viralidad que los informativos.',
  '🏛️ Un Topic Cluster genera 5x más tráfico que artículos aislados.',
  '🪝 Los hooks tipo estadística retienen al lector un 40% más.',
  '📡 Distribuir 1 artículo en 5 formatos multiplica tu alcance sin crear contenido nuevo.',
]

const DEFAULT_PROFILE = { name: 'Blogger', niche: 'Marketing Digital', audience: 'emprendedores' }

function getWeekArticles(articles: { createdAt?: string }[]) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return articles.filter(a => a.createdAt && new Date(a.createdAt) >= monday).length
}

function getStreak(articles: { createdAt?: string }[]) {
  if (!articles.length) return 0
  const dates = [...new Set(
    articles.map(a => a.createdAt ? new Date(a.createdAt).toDateString() : null).filter(Boolean)
  )].sort().reverse()
  let streak = 0
  let current = new Date(); current.setHours(0, 0, 0, 0)
  for (const d of dates) {
    const dt = new Date(d!)
    const diff = Math.floor((current.getTime() - dt.getTime()) / 86400000)
    if (diff <= 1) { streak++; current = dt } else break
  }
  return streak
}

const APEX = [
  { href: '/scorecard',   icon: Star,    label: 'Scorecard APEX',    desc: 'Califica 0-100',        color: '#a855f7' },
  { href: '/clusters',    icon: Network, label: 'Topic Clusters',    desc: 'Domina nichos',          color: '#06b6d4' },
  { href: '/hooks',       icon: Anchor,  label: 'Generador de Hooks',desc: 'Detén el scroll',        color: '#f59e0b' },
  { href: '/distribucion',icon: Share2,  label: 'Distribución',      desc: '1 artículo → 7 formatos',color: '#10b981' },
  { href: '/growth',      icon: BarChart2,label: 'Growth Log',        desc: 'Experimenta y crece',   color: '#ef4444' },
]

export default function Dashboard() {
  const [profile, setProfile]  = useState<{ name: string; niche: string; audience?: string } | null>(null)
  const [hasProfile, setHasProfile] = useState(true)
  const [tip, setTip]          = useState(TIPS[0])
  const [stats, setStats]      = useState({ ideas: 0, articles: 0, week: 0, streak: 0, calendar: 0 })
  const [recent, setRecent]    = useState<Array<{ titulo?: string; title?: string; createdAt?: string; type: string }>>([])

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (saved) {
      setProfile(JSON.parse(saved))
      setHasProfile(true)
    } else {
      setProfile(DEFAULT_PROFILE)
      setHasProfile(false)
    }

    const ideas     = JSON.parse(localStorage.getItem('blogos_ideas')    || '[]')
    const articles  = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    const calendar  = JSON.parse(localStorage.getItem('blogos_calendar') || '[]')

    setStats({
      ideas:    ideas.length,
      articles: articles.length,
      week:     getWeekArticles(articles),
      streak:   getStreak(articles),
      calendar: calendar.filter((c: { status?: string }) => c.status !== 'published').length,
    })

    const recentItems = [
      ...articles.slice(0, 2).map((a: { titulo?: string; createdAt?: string }) => ({ ...a, type: 'article' })),
      ...ideas.slice(0, 2).map((i: { titulo?: string; createdAt?: string }) => ({ ...i, type: 'idea' })),
    ].slice(0, 4)
    setRecent(recentItems)
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
  }, [])

  if (!profile) return null

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const weekPct  = Math.min((stats.week / 3) * 100, 100)

  return (
    <div className="animate-fade-in">

      {/* Banner onboarding pendiente */}
      {!hasProfile && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
            <strong style={{ color: '#f59e0b' }}>Personaliza tu agente</strong> — completa tu perfil para que la IA genere contenido adaptado a ti.
          </div>
          <Link href="/onboarding" style={{
            fontSize: 12, fontWeight: 700, color: '#f59e0b',
            textDecoration: 'none', padding: '5px 12px',
            border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, flexShrink: 0,
          }}>
            Configurar →
          </Link>
        </div>
      )}

      {/* Saludo */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {greeting}, {profile.name}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
            Nicho: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.niche}</span>
          </p>
        </div>
        {stats.streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 30,
          }}>
            <Flame size={15} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{stats.streak} días seguidos</span>
          </div>
        )}
      </div>

      {/* Tip */}
      <div style={{
        padding: '10px 14px', background: 'rgba(124,58,237,0.07)',
        border: '1px solid rgba(124,58,237,0.18)', borderRadius: 10, marginBottom: 22,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Zap size={15} color="#a78bfa" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tip del día</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{tip}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Ideas guardadas',    value: stats.ideas,    icon: Lightbulb,  color: '#f59e0b', href: '/ideas' },
          { label: 'Artículos creados',  value: stats.articles, icon: BookOpen,   color: '#7c3aed', href: '/articulo' },
          { label: 'En agenda',          value: stats.calendar, icon: Target,     color: '#06b6d4', href: '/calendario' },
          { label: 'Esta semana',        value: `${stats.week}/3`, icon: Sparkles, color: '#10b981', href: '/calendario' },
        ].map((s, i) => (
          <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: `${s.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Progreso semanal */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📅 Meta semanal</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>3 artículos esta semana</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: stats.week >= 3 ? '#10b981' : '#f59e0b' }}>{stats.week}/3</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${weekPct}%` }} />
        </div>
        {stats.week === 0 && (
          <Link href="/articulo" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '8px 12px', textAlign: 'center',
              background: 'rgba(124,58,237,0.08)', borderRadius: 8,
              fontSize: 12, color: '#a78bfa', cursor: 'pointer',
            }}>✍️ Escribir tu primer artículo de la semana →</div>
          </Link>
        )}
      </div>

      {/* Acciones rápidas */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Empezar ahora</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { href: '/ideas',    icon: Lightbulb, title: 'Generar Ideas',  desc: '8 ideas en segundos',        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { href: '/articulo', icon: Pen,       title: 'Nuevo Artículo', desc: 'Metodología 6 secciones',    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          { href: '/seo',      icon: TrendingUp,title: 'SEO & Copy',     desc: 'Análisis + keywords + meta', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { href: '/hooks',    icon: Anchor,    title: 'Generar Hook',   desc: '6 fórmulas irresistibles',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{
              padding: '14px', background: a.bg,
              border: `1px solid ${a.color}25`, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <a.icon size={17} color={a.color} />
                <ArrowRight size={13} color={a.color} style={{ opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Herramientas APEX */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>⚡ Herramientas PRO</h2>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white',
        }}>APEX</span>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 22 }}>
        {APEX.map(t => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div className="card card-hover" style={{
              padding: '12px 14px', width: 145, cursor: 'pointer',
              borderTop: `2px solid ${t.color}`,
            }}>
              <t.icon size={17} color={t.color} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Actividad reciente */}
      {recent.length > 0 && (
        <>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Actividad reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {recent.map((item, i) => (
              <div key={i} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: item.type === 'article' ? 'rgba(124,58,237,0.15)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  {item.type === 'article' ? '✍️' : '💡'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.titulo || item.title || 'Sin título'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {item.type === 'article' ? 'Artículo' : 'Idea'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Reciente'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Perfil */}
      <div style={{
        padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {hasProfile ? `Perfil activo · ${profile.niche}` : 'Perfil sin configurar'}
        </span>
        <Link href={hasProfile ? '/perfil' : '/onboarding'} style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none' }}>
          {hasProfile ? 'Editar →' : 'Configurar →'}
        </Link>
      </div>

    </div>
  )
}
