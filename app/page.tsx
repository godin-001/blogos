'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Lightbulb, Pen, TrendingUp, ArrowRight,
  Zap, Star, Network, Anchor, Share2, BarChart2,
  Flame, BookOpen, Target, Sparkles
} from 'lucide-react'

const TIPS = [
  '💡 Los mejores blogs responden una pregunta que el lector ni sabía que tenía.',
  '✍️ Escribe el primer borrador sin editar. Edita siempre en la segunda pasada.',
  '🎯 Un título con número específico genera 36% más clics. Ej: "7 formas de..."',
  '🔥 Tus primeras 2 oraciones deciden si alguien sigue leyendo. Haz que importen.',
  '📊 La consistencia gana a la perfección. Publica 2x/semana antes que 1 artículo perfecto.',
  '💬 Los artículos de opinión tienen 3x más viralidad que los puramente informativos.',
  '🚀 Un CTA al 50% del artículo convierte 2x más que solo ponerlo al final.',
  '🏛️ Un Topic Cluster (1 pilar + 6 clusters) genera 5x más tráfico orgánico que artículos aislados.',
  '🪝 Los hooks tipo "estadística impactante" retienen al lector un 40% más que los hooks narrativos.',
  '📡 Distribuir 1 artículo en 5 formatos multiplica tu alcance sin crear contenido nuevo.',
]

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay() // 0 = domingo
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getStreak(articles: { createdAt?: string }[]): number {
  if (!articles.length) return 0
  const dates = [...new Set(
    articles.map(a => a.createdAt ? new Date(a.createdAt).toDateString() : null).filter(Boolean)
  )].sort().reverse()

  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const d of dates) {
    const dt = new Date(d!)
    const diff = Math.floor((current.getTime() - dt.getTime()) / 86400000)
    if (diff <= 1) { streak++; current = dt }
    else break
  }
  return streak
}

const APEX_TOOLS = [
  { href: '/scorecard', icon: Star,    label: 'Scorecard APEX',   desc: 'Califica tu artículo 0-100', color: '#a855f7' },
  { href: '/clusters',  icon: Network, label: 'Topic Clusters',   desc: 'Domina nichos completos',    color: '#06b6d4' },
  { href: '/hooks',     icon: Anchor,  label: 'Generador de Hooks',desc: 'Detén el scroll en 3 seg', color: '#f59e0b' },
  { href: '/distribucion',icon: Share2,label: 'Distribución',     desc: '1 artículo → 7 formatos',   color: '#10b981' },
  { href: '/growth',    icon: BarChart2,label: 'Growth Log',       desc: 'Experimenta y aprende',     color: '#ef4444' },
]

export default function Dashboard() {
  const router  = useRouter()
  const [profile, setProfile] = useState<{ name: string; niche: string } | null>(null)
  const [tip, setTip]         = useState(TIPS[0])
  const [stats, setStats]     = useState({
    ideas: 0, articles: 0, weekArticles: 0,
    streak: 0, calendar: 0, experiments: 0,
  })
  const [recent, setRecent] = useState<Array<{ titulo?: string; title?: string; createdAt?: string; type: string }>>([])

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (!saved) { router.push('/onboarding'); return }
    setProfile(JSON.parse(saved))

    const ideas       = JSON.parse(localStorage.getItem('blogos_ideas')       || '[]')
    const articles    = JSON.parse(localStorage.getItem('blogos_articles')     || '[]')
    const calendar    = JSON.parse(localStorage.getItem('blogos_calendar')     || '[]')
    const experiments = JSON.parse(localStorage.getItem('blogos_growth')       || '[]')

    const { monday, sunday } = getWeekBounds()
    const weekArticles = articles.filter((a: { createdAt?: string }) => {
      if (!a.createdAt) return false
      const d = new Date(a.createdAt)
      return d >= monday && d <= sunday
    }).length

    setStats({
      ideas:       ideas.length,
      articles:    articles.length,
      weekArticles,
      streak:      getStreak(articles),
      calendar:    calendar.filter((c: { status?: string }) => c.status !== 'published').length,
      experiments: experiments.filter((e: { estado?: string }) => e.estado === 'activo').length,
    })

    // Actividad reciente
    const recentIdeas    = ideas.slice(0, 2).map((i: { titulo?: string; createdAt?: string }) => ({ ...i, type: 'idea' }))
    const recentArticles = articles.slice(0, 2).map((a: { titulo?: string; createdAt?: string }) => ({ ...a, type: 'article' }))
    setRecent([...recentArticles, ...recentIdeas].slice(0, 4))

    setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
  }, [router])

  if (!profile) return null

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const weekPct  = Math.min((stats.weekArticles / 3) * 100, 100)

  return (
    <div className="animate-fade-in">

      {/* ── Saludo ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>
              {greeting}, {profile.name}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
              Nicho: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{profile.niche}</span>
            </p>
          </div>
          {stats.streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 30,
            }}>
              <Flame size={16} color="#f59e0b" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{stats.streak} día{stats.streak !== 1 ? 's' : ''} en racha</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tip del día ── */}
      <div style={{
        padding: '12px 16px', background: 'rgba(124,58,237,0.07)',
        border: '1px solid rgba(124,58,237,0.18)', borderRadius: 10, marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Zap size={16} color="#a78bfa" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tip del día</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{tip}</div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Ideas guardadas',   value: stats.ideas,       icon: Lightbulb,  color: '#f59e0b', href: '/ideas' },
          { label: 'Artículos totales', value: stats.articles,    icon: BookOpen,   color: '#7c3aed', href: '/articulo' },
          { label: 'Pendientes en agenda', value: stats.calendar, icon: Target,     color: '#06b6d4', href: '/calendario' },
          { label: 'Experimentos activos', value: stats.experiments, icon: Sparkles, color: '#ef4444', href: '/growth' },
        ].map((s, i) => (
          <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${s.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={17} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Progreso semanal ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📅 Meta semanal de publicación</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Objetivo: 3 artículos esta semana</div>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 800,
            color: stats.weekArticles >= 3 ? '#10b981' : '#f59e0b',
          }}>{stats.weekArticles}/3</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${weekPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
            const active = i < stats.weekArticles
            return (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: active ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: active ? 'white' : 'var(--text-muted)', fontWeight: 700,
                }}>{active ? '✓' : ''}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{day}</div>
              </div>
            )
          })}
        </div>
        {stats.weekArticles === 0 && (
          <Link href="/articulo" style={{ textDecoration: 'none' }}>
            <div style={{
              marginTop: 12, padding: '8px 12px', textAlign: 'center',
              background: 'rgba(124,58,237,0.08)', borderRadius: 8,
              fontSize: 12, color: '#a78bfa', cursor: 'pointer',
            }}>
              ✍️ Escribir primer artículo de la semana →
            </div>
          </Link>
        )}
      </div>

      {/* ── Acciones rápidas ── */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Empezar ahora</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { href: '/ideas',     icon: Lightbulb, title: 'Generar Ideas',    desc: '8 ideas en 10 segundos',          color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { href: '/articulo',  icon: Pen,        title: 'Nuevo Artículo',   desc: 'Metodología de 6 secciones',      color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          { href: '/seo',       icon: TrendingUp, title: 'SEO & Copy',       desc: 'Análisis + keywords + meta',      color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { href: '/hooks',     icon: Anchor,     title: 'Generar Hook',     desc: '6 fórmulas para atrapar lectores',color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{
              padding: '16px', background: a.bg,
              border: `1px solid ${a.color}25`, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <a.icon size={18} color={a.color} />
                <ArrowRight size={14} color={a.color} style={{ opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Herramientas APEX ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>⚡ Herramientas PRO</h2>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white',
        }}>APEX</span>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
        {APEX_TOOLS.map(t => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div className="card card-hover" style={{
              padding: '14px 16px', width: 150, cursor: 'pointer',
              borderTop: `2px solid ${t.color}`,
            }}>
              <t.icon size={18} color={t.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Actividad reciente ── */}
      {recent.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Actividad reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map((item, i) => (
              <div key={i} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: item.type === 'article' ? 'rgba(124,58,237,0.15)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
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

      {/* ── Enlace perfil ── */}
      <div style={{
        marginTop: 20, padding: '10px 14px',
        border: '1px solid var(--border)', borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Perfil configurado · <span style={{ color: 'var(--text)' }}>{profile.niche}</span>
        </span>
        <Link href="/perfil" style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none' }}>Editar perfil →</Link>
      </div>

    </div>
  )
}
