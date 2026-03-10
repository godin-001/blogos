'use client'

import { Menu, X } from 'lucide-react'

interface MobileHeaderProps {
  mobileOpen: boolean
  onToggle: () => void
}

export function MobileHeader({ mobileOpen, onToggle }: MobileHeaderProps) {
  return (
    <div
      className="mobile-header"
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        onClick={onToggle}
        style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
      <div style={{ fontWeight: 700, fontSize: 16 }} className="gradient-text">BlogOS</div>
      <div style={{ width: 22 }} aria-hidden="true" />
    </div>
  )
}
