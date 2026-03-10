'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getStoredKeys } from '@/lib/api'

export default function NewsletterSend({
  defaultSubject,
  content,
}: {
  defaultSubject?: string
  content: string
}) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(defaultSubject || '')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const sendEmail = async () => {
    if (!to.trim() || !subject.trim()) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const keys = getStoredKeys()
      if (!keys.resend) {
        setErrorMsg('Configura tu API key de Resend en Configuración')
        setStatus('error')
        return
      }
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-resend-key': keys.resend,
        },
        body: JSON.stringify({ to, subject, content }),
      })
      const data = await res.json()
      if (data.id) {
        setStatus('sent')
      } else {
        throw new Error(data.error || 'Error al enviar')
      }
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
        📧 Enviar como Newsletter
      </div>
      <input
        className="input"
        type="email"
        placeholder="Email del destinatario..."
        value={to}
        onChange={e => setTo(e.target.value)}
        style={{ marginBottom: 8, fontSize: 13 }}
      />
      <input
        className="input"
        placeholder="Asunto del email..."
        value={subject}
        onChange={e => setSubject(e.target.value)}
        style={{ marginBottom: 12, fontSize: 13 }}
      />
      <button
        className="btn btn-primary"
        onClick={sendEmail}
        disabled={status === 'sending' || !to.trim() || !subject.trim()}
        style={{ width: '100%', justifyContent: 'center', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {status === 'sending' && <><Loader2 size={14} className="spin" /> Enviando...</>}
        {status === 'idle' && <><Send size={14} /> Enviar email</>}
        {status === 'sent' && <><CheckCircle size={14} /> ¡Enviado!</>}
        {status === 'error' && <><AlertCircle size={14} /> Error — Reintentar</>}
      </button>
      {status === 'sent' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#34d399' }}>
          ✅ Email enviado correctamente a {to}
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  )
}
