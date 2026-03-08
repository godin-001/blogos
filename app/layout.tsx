'use client'

import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Lightbulb, HelpCircle,
  Calendar, DollarSign, Settings, Pen, Menu, X,
  Sparkles, TrendingUp, Key, Star, Network,
  Anchor, Share2, BarChart2
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', group: 'main' },
  { href: '/ideas', icon: Lightbulb, label: 'Ideas', group: 'main' },
  { href: '/articulo', icon: Pen, label: 'Nuevo Artículo', group: 'main' },
  { href: '/preguntas', icon: HelpCircle, label: 'Sesión Reflexiva', group: 'main' },
  { href: '/seo', icon: TrendingUp, label: 'SEO & Copy', group: 'main' },
  { href: '/calendario', icon: Calendar, label: 'Calendario', group: 'main' },
  { href: '/monetizacion', icon: DollarSign, label: 'Monetización', group: 'main' },
  { href: '/scorecard', icon: Star, label: 'Scorecard APEX', group: 'pro', badge: 'PRO' },
  { href: '/clusters', icon: Network, label: 'Topic Clusters', group: 'pro', badge: 'PRO' },
  { href: '/hooks', icon: Anchor, label: 'Generador de Hooks', group: 'pro', badge: 'PRO' },
  { href: '/distribucion', icon: Share2, label: 'Distribución', group: 'pro', badge: 'PRO' },
  { href: '/growth', icon: BarChart2, label: 'Growth Log', group: 'pro', badge: 'PRO' },
  { href: '/perfil', icon: Settings, label: 'Mi Perfil', group: 'config' },
  { href: '/configuracion', icon: Key, label: 'APIs', group: 'config' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<{ name: string; niche: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('blogos_profile')
    if (saved) setProfile(JSON.parse(saved))
    // Check if any API key is configured
    const keys = localStorage.getItem('blogos_api_keys')
    if (keys) {
      const parsed = JSON.parse(keys)
      if (parsed.anthropic) setProfile(prev => prev ? { ...prev, hasKey: 'true' } : null)
    }
  }, [])

  const isOnboarding = pathname === '/onboarding'

  if (isOnboarding) {
    return (
      <html lang="es">
        <body style={{ background: 'var(--bg-base)' }}>{children}</body>
      </html>
    )
  }

  return (
    <html lang="es">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }}
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside style={{
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
          className="lg-sidebar">
            {/* Logo */}
            <div style={{ padding: '0 8px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Sparkles size={18} color="white" />
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
                  borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)'
                }}>
                  <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>✍️ {profile.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{profile.niche}</div>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {['main','pro','config'].map(group => (
                <div key={group}>
                  {group === 'pro' && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 4px' }}>
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
                      onClick={() => setMobileOpen(false)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={17} />
                        <span style={{ fontSize: 13 }}>{label}</span>
                      </span>
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 4, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                          color: 'white', letterSpacing: '0.05em'
                        }}>{badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Bottom */}
            <div style={{
              marginTop: 16, padding: '12px',
              background: 'rgba(245,158,11,0.08)',
              borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🎯 Meta semanal</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>2-3 artículos por semana</div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-bar-fill" style={{ width: '33%' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>1 de 3 esta semana</div>
            </div>
          </aside>

          {/* Desktop sidebar spacer */}
          <div style={{ width: 240, flexShrink: 0 }} className="desktop-spacer" />

          {/* Main content */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Mobile header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card)',
              position: 'sticky', top: 0, zIndex: 30,
            }}>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <div style={{ fontWeight: 700, fontSize: 16 }} className="gradient-text">BlogOS</div>
              <div style={{ width: 22 }} />
            </div>

            <div style={{ flex: 1, padding: '32px 24px', maxWidth: 1000, width: '100%', margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>

        <style jsx global>{`
          @media (min-width: 768px) {
            .lg-sidebar { left: 0 !important; }
            .desktop-spacer { display: block; }
          }
          @media (max-width: 767px) {
            .desktop-spacer { display: none; }
          }
        `}</style>
      </body>
    </html>
  )
}
