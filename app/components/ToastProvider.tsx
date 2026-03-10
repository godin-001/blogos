'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        },
      }}
    />
  )
}
