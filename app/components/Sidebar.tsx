'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Lightbulb, HelpCircle,
  Calendar, DollarSign, Settings, Pen,
  Sparkles, TrendingUp, Key, Star, Network,
  Anchor, Share2, BarChart2, BookOpen, Flame
} from 'lucide-react'

const navItems = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard',           group: 'main' },
  { href: '/ideas',        icon: Lightbulb,       label: 'Ideas',               group: 'main' },
  { href: '/articulo',     icon: Pen,             label: 'Nuevo Artículo',      group: 'main' },
  { href: '/preguntas',    icon: HelpCircle,      label: 'Sesión Reflexiva',    group: 'main' },
  { href: '/seo',          icon: TrendingUp,      label: 'SEO & Copy',          group: 'main' },
  { href: '/calendario',   icon: Calendar,        label: 'Calendario',          group: 'main' },
  { href: '/monetizacion', icon: DollarSign,      label: 'Monetización',        group: 'main' },
  { href: '/tecnicas',     icon: BookOpen,        label: '106 Técnicas',        group: 'pro', badge: 'NEW' },
  { href: '/scorecard',    icon: Star,            label: 'Scorecard APEX',      group: 'pro', badge: 'PRO' },
  { href: '/clusters',     icon: Network,         label: 'Topic Clusters',      group: 'pro', badge: 'PRO' },
  { href: '/hooks',        icon: Anchor,          label: 'Generador de Hooks',  group: 'pro', badge: 'PRO' },
  { href: '/distribucion', icon: Share2,          label: 'Distribución',        group: 'pro', badge: 'PRO' },
  { href: '/growth',       icon: BarChart2,       label: 'Growth Log',          group: 'pro', badge: 'PRO' },
  { href: '/perfil',       icon: Settings,        label: 'Mi Perfil',           group: 'config' },
  { href: '/configuracion',icon: Key,             label: 'APIs',                group: 'config' },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ name: string; niche: string } | null>(null)
  const [weekStats, setWeekStats] = useState({ count: 0, goal: 3 })

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (saved) setProfile(JSON.parse(saved))

    // Calcular artículos de la semana para la meta
    const articles = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    monday.setHours(0, 0, 0, 0)
    const weekCount = articles.filter(
      (a: { createdAt?: string }) => a.createdAt && new Date(a.createdAt) >= monday
    ).length
    setWeekStats({ count: weekCount, goal: 3 })
  }, [pathname]) // re-calcular al cambiar de página

  const weekPct = Math.min((weekStats.count / weekStats.goal) * 100, 100)

  return (
    <aside
      style={{
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        position: 'fixed',
        top: 0,
        left: mobileOpen ? 0 : '-240px',
        height: '100vh',
        zIndex: 50,
        transition: 'left 0.3s ease',
        overflowY: 'auto',
      }}
      className="lg-sidebar"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div style={{ padding: '0 8px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="white" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>BlogOS</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agente Founder</div>
          </div>
        </div>
        {profile && (
          <div style={{
            marginTop: 12, padding: '8px 10px',
            background: 'rgba(124,58,237,0.1)',
            borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>✍️ {profile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{profile.niche}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }} aria-label="Menú">
        {(['main', 'pro', 'config'] as const).map(group => (
          <div key={group}>
            {group === 'pro' && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#7c3aed',
                textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 4px',
              }}>
                ⚡ Herramientas PRO
              </div>
            )}
            {group === 'config' && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }} />
            )}
            {navItems.filter(n => n.group === group).map(({ href, icon: Icon, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={`sidebar-item ${pathname === href ? 'active' : ''}`}
                onClick={onClose}
                style={{ justifyContent: 'space-between' }}
                aria-current={pathname === href ? 'page' : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={17} aria-hidden="true" />
                  <span style={{ fontSize: 13 }}>{label}</span>
                </span>
                {badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                    borderRadius: 4, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    color: 'white', letterSpacing: '0.05em',
                  }}>{badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Meta semanal — conectada a datos reales */}
      <div style={{
        marginTop: 16, padding: '12px',
        background: 'rgba(245,158,11,0.08)',
        borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {weekStats.count >= weekStats.goal
            ? <Flame size={13} color="#10b981" aria-hidden="true" />
            : <Flame size={13} color="#fbbf24" aria-hidden="true" />
          }
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Meta semanal</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {weekStats.count >= weekStats.goal ? '🎉 ¡Meta cumplida!' : `${weekStats.count} de ${weekStats.goal} artículos`}
        </div>
        <div
          className="progress-bar"
          style={{ marginTop: 8 }}
          role="progressbar"
          aria-valuenow={weekStats.count}
          aria-valuemin={0}
          aria-valuemax={weekStats.goal}
          aria-label={`${weekStats.count} de ${weekStats.goal} artículos esta semana`}
        >
          <div className="progress-bar-fill" style={{ width: `${weekPct}%` }} />
        </div>
      </div>
    </aside>
  )
}
