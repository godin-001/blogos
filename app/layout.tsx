'use client'

import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Lightbulb, HelpCircle,
  Calendar, DollarSign, Settings, Pen, Menu, X,
  Sparkles, TrendingUp, Key
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { href: '/articulo', icon: Pen, label: 'Nuevo Artículo' },
  { href: '/preguntas', icon: HelpCircle, label: 'Sesión Reflexiva' },
  { href: '/seo', icon: TrendingUp, label: 'SEO & Copy' },
  { href: '/calendario', icon: Calendar, label: 'Calendario' },
  { href: '/monetizacion', icon: DollarSign, label: 'Monetización' },
  { href: '/perfil', icon: Settings, label: 'Mi Perfil' },
  { href: '/configuracion', icon: Key, label: 'APIs' },
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
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-item ${pathname === href ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </Link>
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
