'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Onboarding: layout minimalista sin sidebar
  if (pathname === '/onboarding') {
    return <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>{children}</div>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay para móvil */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Spacer para desktop */}
      <div style={{ width: 240, flexShrink: 0 }} className="desktop-spacer" aria-hidden="true" />

      {/* Contenido principal */}
      <main
        id="main-content"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <MobileHeader mobileOpen={mobileOpen} onToggle={() => setMobileOpen(v => !v)} />
        <div style={{ flex: 1, padding: '32px 24px', maxWidth: 1000, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
