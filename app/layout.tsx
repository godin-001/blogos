// Server Component — sin 'use client'
// La lógica de estado (sidebar, perfil) vive en ShellLayout (client)
import type { Metadata } from 'next'
import './globals.css'
import { ShellLayout } from './components/ShellLayout'
import { ToastProvider } from './components/ToastProvider'
import { SkipNav } from './components/SkipNav'

export const metadata: Metadata = {
  title: {
    default: 'BlogOS — Agente Founder',
    template: '%s | BlogOS',
  },
  description: 'Tu agente de blogging con IA: genera ideas, escribe artículos, optimiza SEO y monetiza tu blog.',
  keywords: ['blog', 'IA', 'SEO', 'contenido', 'escritura'],
  openGraph: {
    title: 'BlogOS — Agente Founder',
    description: 'Tu agente de blogging con IA',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SkipNav />
        <ShellLayout>{children}</ShellLayout>
        <ToastProvider />
      </body>
    </html>
  )
}
