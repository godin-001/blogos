'use client'

import { useState, useEffect } from 'react'
import { Key, Check, Eye, EyeOff, ExternalLink, Zap, AlertCircle, CheckCircle, Loader2, Wifi, WifiOff } from 'lucide-react'

type ApiStatus = 'idle' | 'testing' | 'ok' | 'error'
type ApiConfig = { anthropic: string; serper: string; newsapi: string; groq: string; gemini: string }
type HealthStatus = { status: 'live' | 'demo' | 'checking'; mode: string; latency?: number }

const API_INFO = [
  {
    id: 'anthropic' as keyof ApiConfig,
    name: 'Anthropic Claude',  emoji: '🤖', color: '#7c3aed', badge: 'Principal',
    desc: 'Motor de IA principal. Genera ideas, escribe secciones, analiza SEO y conduce sesiones reflexivas.',
    features: ['Generador de ideas', 'Escritura asistida', 'Análisis SEO', 'Sesión reflexiva', 'Hooks y copywriting'],
    getKey: 'https://console.anthropic.com/keys', placeholder: 'sk-ant-...',
  },
  {
    id: 'groq' as keyof ApiConfig,
    name: 'Groq (Llama 3.1)',  emoji: '⚡', color: '#06b6d4', badge: 'Gratis',
    desc: 'IA ultra-rápida basada en Llama 3.1. Respuestas en menos de 1 segundo. Tier gratuito generoso.',
    features: ['10x más rápida que Claude', '30 req/min gratis', 'Sin tarjeta de crédito', 'Llama 3.1 70B', 'Fallback automático'],
    getKey: 'https://console.groq.com/keys', placeholder: 'gsk_...',
  },
  {
    id: 'gemini' as keyof ApiConfig,
    name: 'Google Gemini',     emoji: '✨', color: '#4285f4', badge: 'Gratis',
    desc: 'IA de Google con tier gratuito. 15 requests/min sin costo. Excelente para contenido largo.',
    features: ['15 req/min gratis', 'Gemini 1.5 Flash', 'Sin tarjeta de crédito', 'AI Studio gratuito', 'Fallback automático'],
    getKey: 'https://aistudio.google.com/apikey', placeholder: 'AIzaSy...',
  },
  {
    id: 'serper' as keyof ApiConfig,
    name: 'Serper (Google)',    emoji: '🔍', color: '#10b981', badge: 'SEO',
    desc: 'Datos reales de Google: posicionamiento de competidores, keywords relacionadas y noticias de tu nicho.',
    features: ['Top 10 Google real', 'Keywords long-tail', 'Dificultad de keyword', 'Noticias del nicho', 'Análisis de competencia'],
    getKey: 'https://serper.dev', placeholder: 'tu-key-de-serper',
  },
  {
    id: 'newsapi' as keyof ApiConfig,
    name: 'NewsAPI',           emoji: '📰', color: '#f59e0b', badge: 'Noticias',
    desc: 'Noticias en tiempo real de tu industria para inspirar artículos relevantes y captar tendencias.',
    features: ['Noticias en tiempo real', 'Ideas desde tendencias', 'Fuentes verificadas', 'Filtro por idioma', 'Temas virales'],
    getKey: 'https://newsapi.org/register', placeholder: 'tu-key-de-newsapi',
  },
]

export default function ConfiguracionPage() {
  const [keys, setKeys]     = useState<ApiConfig>({ anthropic: '', serper: '', newsapi: '', groq: '', gemini: '' })
  const [show, setShow]     = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Record<string, ApiStatus>>({})
  const [saved, setSaved]   = useState(false)
  const [health, setHealth] = useState<HealthStatus>({ status: 'checking', mode: 'Verificando...' })

  useEffect(() => {
    const stored = localStorage.getItem('blogos_api_keys')
    if (stored) setKeys(JSON.parse(stored))
    checkHealth()
  }, [])

  async function checkHealth() {
    setHealth({ status: 'checking', mode: 'Verificando conexión AI...' })
    try {
      const t = Date.now()
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealth({ status: data.status, mode: data.mode, latency: Date.now() - t })
    } catch {
      setHealth({ status: 'demo', mode: 'Sin conexión — modo demo activo' })
    }
  }

  function saveKeys() {
    localStorage.setItem('blogos_api_keys', JSON.stringify(keys))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function testApi(apiId: keyof ApiConfig) {
    const key = keys[apiId]
    if (!key.trim()) return
    setStatus(prev => ({ ...prev, [apiId]: 'testing' }))
    try {
      let ok = false
      if (apiId === 'anthropic') {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-anthropic-key': key },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Responde solo: OK' }] }),
        })
        const d = await res.json()
        ok = !d.error && !!d.text
      } else if (apiId === 'serper') {
        const res = await fetch('/api/seo-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-serper-key': key },
          body: JSON.stringify({ keyword: 'test' }),
        })
        const d = await res.json()
        ok = !d.error
      } else if (apiId === 'groq') {
        const res = await fetch('/api/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-groq-key': key },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Responde solo: OK' }] }),
        })
        const d = await res.json()
        ok = !d.error && !!d.text
      } else if (apiId === 'gemini') {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-gemini-key': key },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Responde solo: OK' }] }),
        })
        const d = await res.json()
        ok = !d.error && !!d.text
      } else {
        const res = await fetch('/api/tendencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-news-key': key },
          body: JSON.stringify({ niche: 'marketing' }),
        })
        const d = await res.json()
        ok = d.fuente !== 'error'
      }
      setStatus(prev => ({ ...prev, [apiId]: ok ? 'ok' : 'error' }))
    } catch {
      setStatus(prev => ({ ...prev, [apiId]: 'error' }))
    }
  }

  const hasKey     = (id: keyof ApiConfig) => keys[id]?.trim().length > 5
  const activeCount = Object.values(keys).filter(k => k.trim().length > 5).length

  const statusIcon = (id: string) => {
    const s = status[id]
    if (s === 'testing') return <Loader2 size={14} className="spin" color="#a78bfa" />
    if (s === 'ok')      return <CheckCircle size={14} color="#10b981" />
    if (s === 'error')   return <AlertCircle size={14} color="#ef4444" />
    return <Zap size={14} />
  }

  const statusText = (id: string) => {
    const s = status[id]
    if (s === 'testing') return { text: 'Probando...', color: '#a78bfa' }
    if (s === 'ok')      return { text: '✓ Conectada y funcionando', color: '#10b981' }
    if (s === 'error')   return { text: '✗ Key inválida o sin créditos', color: '#ef4444' }
    return null
  }

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🔑 Configuración</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          APIs para potenciar la inteligencia de BlogOS
        </p>
      </div>

      {/* ── AI Status Card ── */}
      <div className="card" style={{
        marginBottom: 24,
        background: health.status === 'live'
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))'
          : health.status === 'checking'
            ? 'rgba(124,58,237,0.05)'
            : 'rgba(245,158,11,0.06)',
        border: `1px solid ${health.status === 'live' ? 'rgba(16,185,129,0.3)' : health.status === 'checking' ? 'rgba(124,58,237,0.2)' : 'rgba(245,158,11,0.25)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {health.status === 'checking' && <Loader2 size={22} className="spin" color="#a78bfa" />}
            {health.status === 'live'     && <Wifi size={22} color="#10b981" />}
            {health.status === 'demo'     && <WifiOff size={22} color="#f59e0b" />}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
                {health.status === 'live'     && '🟢 IA en vivo — Claude activo'}
                {health.status === 'demo'     && '🟡 Modo demo — IA simulada'}
                {health.status === 'checking' && '🔵 Verificando estado de la IA...'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {health.mode}
                {health.latency && ` · ${health.latency}ms`}
              </div>
            </div>
          </div>
          <button
            onClick={checkHealth}
            style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Loader2 size={12} /> Verificar
          </button>
        </div>

        {health.status === 'live' && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(16,185,129,0.08)', borderRadius: 8,
            fontSize: 12, color: '#10b981',
          }}>
            ✅ BlogOS está usando IA real con Claude Opus. Las respuestas son generadas por Claude, no son datos simulados.
          </div>
        )}
        {health.status === 'demo' && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(245,158,11,0.08)', borderRadius: 8,
            fontSize: 12, color: '#f59e0b',
          }}>
            ℹ️ Sin key propia: BlogOS usa datos demo ricos y contextualzados. Agrega tu API key de Anthropic para activar la IA real.
          </div>
        )}
      </div>

      {/* ── Progress pills ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeCount}/3 APIs configuradas</span>
        {API_INFO.map(api => (
          <div key={api.id} style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
            background: hasKey(api.id) ? `${api.color}18` : 'rgba(107,114,128,0.1)',
            color: hasKey(api.id) ? api.color : '#6b7280',
            border: `1px solid ${hasKey(api.id) ? api.color + '35' : 'var(--border)'}`,
          }}>
            {hasKey(api.id) ? '✓ ' : '○ '}{api.emoji} {api.name.split(' ')[0]}
          </div>
        ))}
      </div>

      {/* ── API Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {API_INFO.map(api => {
          const st = statusText(api.id)
          return (
            <div key={api.id} className="card" style={{
              border: hasKey(api.id) ? `1px solid ${api.color}35` : '1px solid var(--border)',
            }}>
              {/* Top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${api.color}15`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20,
                }}>{api.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{api.name}</span>
                    {hasKey(api.id) && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 10,
                        background: `${api.color}20`, color: api.color, fontWeight: 700,
                      }}>ACTIVA</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{api.desc}</p>
                </div>
                <a href={api.getKey} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: api.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginTop: 2 }}>
                  <ExternalLink size={11} /> Obtener key
                </a>
              </div>

              {/* Features chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {api.features.map(f => (
                  <span key={f} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: hasKey(api.id) ? `${api.color}10` : 'var(--bg-base)',
                    color: hasKey(api.id) ? api.color : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>
                    {hasKey(api.id) ? '✓ ' : '·  '}{f}
                  </span>
                ))}
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    className="input"
                    type={show[api.id] ? 'text' : 'password'}
                    placeholder={api.placeholder}
                    value={keys[api.id]}
                    onChange={e => setKeys(prev => ({ ...prev, [api.id]: e.target.value }))}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    onClick={() => setShow(prev => ({ ...prev, [api.id]: !prev[api.id] }))}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    }}
                    aria-label={show[api.id] ? `Ocultar API key de ${api.name}` : `Mostrar API key de ${api.name}`}
                  >
                    {show[api.id] ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  </button>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => testApi(api.id)}
                  disabled={!hasKey(api.id) || status[api.id] === 'testing'}
                  style={{ fontSize: 12, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {statusIcon(api.id)} Probar
                </button>
              </div>
              {st && <div style={{ fontSize: 12, color: st.color, marginTop: 6 }}>{st.text}</div>}
            </div>
          )
        })}
      </div>

      {/* Save */}
      <button className="btn btn-primary" onClick={saveKeys}
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14 }}>
        {saved ? <><Check size={16} /> ¡Guardado correctamente!</> : <><Key size={16} /> Guardar configuración</>}
      </button>

      {/* Security */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8,
      }}>
        <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 700, marginBottom: 3 }}>🔒 Privacidad garantizada</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Tus keys se guardan <strong>solo en tu navegador</strong> (localStorage). Nunca se envían a servidores de BlogOS. Solo se usan directamente al llamar a Anthropic, Serper o NewsAPI.
        </div>
      </div>

      {/* Quick guide */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>📖 Guía de configuración</h3>
        {[
          { n: '1', title: 'Anthropic (más importante)', color: '#7c3aed', desc: 'console.anthropic.com → API Keys → Create Key. Muy barato (centavos por uso). Activa toda la IA generativa.' },
          { n: '2', title: 'Serper (gratis 2,500/mes)',   color: '#10b981', desc: 'serper.dev → Dashboard → API Key. Plan gratuito suficiente para uso personal. Activa datos reales de Google.' },
          { n: '3', title: 'NewsAPI (gratis 100/día)',    color: '#f59e0b', desc: 'newsapi.org → Get API Key. Plan developer gratuito. Activa las tendencias en tiempo real de tu industria.' },
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `${s.color}20`, border: `1px solid ${s.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: s.color,
            }}>{s.n}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
