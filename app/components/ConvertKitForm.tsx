'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'
import { getStoredKeys } from '@/lib/api'

export default function ConvertKitForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const subscribe = async () => {
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const keys = getStoredKeys()
      if (!keys.convertkit) {
        setErrorMsg('Configura tu API key de ConvertKit en Configuración')
        setStatus('error')
        return
      }
      const res = await fetch('/api/convertkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-convertkit-key': keys.convertkit,
        },
        body: JSON.stringify({ email, first_name: name || undefined }),
      })
      const data = await res.json()
      if (data.subscriber) {
        setStatus('success')
        setEmail('')
        setName('')
      } else {
        throw new Error(data.error || 'Error al suscribir')
      }
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <CheckCircle size={32} color="#34d399" style={{ margin: '0 auto 8px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>¡Suscrito! 🎉</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>El contacto se agregó a tu lista de ConvertKit</div>
        <button className="btn btn-secondary" onClick={() => setStatus('idle')}
          style={{ marginTop: 12, fontSize: 12 }}>
          Agregar otro
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
        📮 Captura de Leads — ConvertKit
      </div>
      <input
        className="input"
        placeholder="Nombre (opcional)"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: 8, fontSize: 13 }}
      />
      <input
        className="input"
        type="email"
        placeholder="Email del suscriptor..."
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginBottom: 12, fontSize: 13 }}
      />
      <button
        className="btn btn-primary"
        onClick={subscribe}
        disabled={status === 'loading' || !email.trim()}
        style={{ width: '100%', justifyContent: 'center', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {status === 'loading'
          ? <><Loader2 size={14} className="spin" /> Suscribiendo...</>
          : <><UserPlus size={14} /> Suscribir</>
        }
      </button>
      {status === 'error' && errorMsg && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}
    </div>
  )
}
