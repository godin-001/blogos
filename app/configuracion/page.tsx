'use client'

import { useState, useEffect } from 'react'
import { Key, Check, Eye, EyeOff, ExternalLink, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

type ApiStatus = 'idle' | 'testing' | 'ok' | 'error'

type ApiConfig = {
  anthropic: string
  serper: string
  newsapi: string
}

const API_INFO = [
  {
    id: 'anthropic' as keyof ApiConfig,
    name: 'Anthropic Claude',
    emoji: '🤖',
    color: '#7c3aed',
    desc: 'Motor principal de IA. Genera ideas, escribe secciones, analiza SEO y conduce sesiones reflexivas.',
    features: ['Generador de ideas personalizado', 'Escritura asistida por sección', 'Análisis SEO inteligente', 'Sesión reflexiva IA adaptativa', 'Análisis de viralidad'],
    getKey: 'https://console.anthropic.com/keys',
    placeholder: 'sk-ant-...',
    header: 'x-anthropic-key',
  },
  {
    id: 'serper' as keyof ApiConfig,
    name: 'Serper (Google Search)',
    emoji: '🔍',
    color: '#10b981',
    desc: 'Datos reales de Google: posicionamiento de competidores, keywords relacionadas y noticias de tu nicho.',
    features: ['Top 10 resultados reales de Google', 'Keywords relacionadas automáticas', 'Nivel de dificultad del keyword', 'Noticias recientes del nicho', 'Análisis de competencia'],
    getKey: 'https://serper.dev',
    placeholder: 'tu-api-key-de-serper',
    header: 'x-serper-key',
  },
  {
    id: 'newsapi' as keyof ApiConfig,
    name: 'NewsAPI (Tendencias)',
    emoji: '📰',
    color: '#f59e0b',
    desc: 'Noticias en tiempo real de tu industria para inspirar artículos relevantes y captar tendencias actuales.',
    features: ['Noticias en tiempo real por nicho', 'Ideas de artículos desde tendencias', 'Fuentes periodísticas verificadas', 'Filtro por idioma y país', 'Alertas de temas virales'],
    getKey: 'https://newsapi.org/register',
    placeholder: 'tu-api-key-de-newsapi',
    header: 'x-news-key',
  },
]

export default function ConfiguracionPage() {
  const [keys, setKeys] = useState<ApiConfig>({ anthropic: '', serper: '', newsapi: '' })
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Record<string, ApiStatus>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('blogos_api_keys')
    if (stored) setKeys(JSON.parse(stored))
  }, [])

  const saveKeys = () => {
    localStorage.setItem('blogos_api_keys', JSON.stringify(keys))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testApi = async (apiId: keyof ApiConfig) => {
    const key = keys[apiId]
    if (!key.trim()) return

    setStatus(prev => ({ ...prev, [apiId]: 'testing' }))

    try {
      if (apiId === 'anthropic') {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-anthropic-key': key,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Responde solo: OK' }],
          }),
        })
        const data = await res.json()
        setStatus(prev => ({ ...prev, [apiId]: data.error ? 'error' : 'ok' }))

      } else if (apiId === 'serper') {
        const res = await fetch('/api/seo-research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-serper-key': key,
          },
          body: JSON.stringify({ keyword: 'test' }),
        })
        const data = await res.json()
        setStatus(prev => ({ ...prev, [apiId]: data.error ? 'error' : 'ok' }))

      } else if (apiId === 'newsapi') {
        const res = await fetch('/api/tendencias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-news-key': key,
          },
          body: JSON.stringify({ niche: 'marketing' }),
        })
        const data = await res.json()
        setStatus(prev => ({ ...prev, [apiId]: data.error && data.fuente !== 'demo' ? 'error' : 'ok' }))
      }
    } catch {
      setStatus(prev => ({ ...prev, [apiId]: 'error' }))
    }
  }

  const getStatusIcon = (apiId: string) => {
    const s = status[apiId]
    if (s === 'testing') return <Loader2 size={16} className="animate-spin" color="#a78bfa" />
    if (s === 'ok') return <CheckCircle size={16} color="#34d399" />
    if (s === 'error') return <AlertCircle size={16} color="#f87171" />
    return null
  }

  const getStatusText = (apiId: string) => {
    const s = status[apiId]
    if (s === 'testing') return { text: 'Probando...', color: '#a78bfa' }
    if (s === 'ok') return { text: 'Conectada ✓', color: '#34d399' }
    if (s === 'error') return { text: 'Key inválida', color: '#f87171' }
    return null
  }

  const hasKey = (id: keyof ApiConfig) => keys[id]?.trim().length > 5
  const activeCount = Object.values(keys).filter(k => k.trim().length > 5).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>🔑 Configuración de APIs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Conecta tus APIs para desbloquear las funciones de IA completas de BlogOS
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        padding: '14px 18px', marginBottom: 24, borderRadius: 10,
        background: activeCount === 3 ? 'rgba(16,185,129,0.08)' : activeCount > 0 ? 'rgba(124,58,237,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${activeCount === 3 ? 'rgba(16,185,129,0.25)' : activeCount > 0 ? 'rgba(124,58,237,0.25)' : 'rgba(245,158,11,0.25)'}`,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <Zap size={18} color={activeCount === 3 ? '#34d399' : activeCount > 0 ? '#a78bfa' : '#fbbf24'} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {activeCount === 0 && 'BlogOS funciona en modo demo — agrega tus APIs para activar la IA'}
            {activeCount === 1 && '1 API conectada — agrega Serper y NewsAPI para más potencia'}
            {activeCount === 2 && '2 APIs conectadas — falta 1 para desbloquear todo'}
            {activeCount === 3 && '🔥 BlogOS al 100% — todas las APIs conectadas'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {activeCount}/{API_INFO.length} APIs activas
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {API_INFO.map(api => (
            <div key={api.id} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: hasKey(api.id) ? api.color : 'var(--border-light)',
            }} title={api.name} />
          ))}
        </div>
      </div>

      {/* API Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {API_INFO.map(api => {
          const st = getStatusText(api.id)
          return (
            <div key={api.id} className="card" style={{
              padding: '20px',
              border: hasKey(api.id) ? `1px solid ${api.color}30` : '1px solid var(--border)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${api.color}15`, border: `1px solid ${api.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>
                  {api.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{api.name}</span>
                    {hasKey(api.id) && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${api.color}20`, color: api.color, fontWeight: 700 }}>
                        ACTIVA
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{api.desc}</p>
                </div>
                <a href={api.getKey} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: api.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <ExternalLink size={12} />
                  Obtener key
                </a>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {api.features.map(f => (
                  <span key={f} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 12,
                    background: 'var(--bg-base)', border: '1px solid var(--border-light)',
                    color: hasKey(api.id) ? api.color : 'var(--text-muted)',
                  }}>
                    {hasKey(api.id) ? '✓ ' : '○ '}{f}
                  </span>
                ))}
              </div>

              {/* Input */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  <Key size={12} style={{ display: 'inline', marginRight: 5 }} />
                  API Key
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="input-field"
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
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                      }}
                    >
                      {show[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => testApi(api.id)}
                    disabled={!hasKey(api.id) || status[api.id] === 'testing'}
                    style={{
                      fontSize: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
                      opacity: hasKey(api.id) ? 1 : 0.4
                    }}
                  >
                    {getStatusIcon(api.id) || <Zap size={14} />}
                    Probar
                  </button>
                </div>
                {st && (
                  <div style={{ fontSize: 12, color: st.color, marginTop: 6 }}>{st.text}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Save */}
      <button
        className="btn-primary"
        onClick={saveKeys}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px' }}
      >
        {saved ? <Check size={18} /> : <Key size={18} />}
        {saved ? '¡APIs guardadas correctamente!' : 'Guardar configuración de APIs'}
      </button>

      {/* Security note */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 700, marginBottom: 4 }}>🔒 Privacidad</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Tus API keys se guardan únicamente en tu navegador (localStorage). No se envían a ningún servidor externo excepto directamente a los servicios correspondientes (Anthropic, Serper, NewsAPI) cuando usas las funciones de IA.
        </div>
      </div>

      {/* How to use guide */}
      <div className="card" style={{ padding: '20px', marginTop: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
          📖 Guía rápida de configuración
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', title: 'Anthropic (recomendado primero)', color: '#7c3aed', desc: 'Ve a console.anthropic.com → API Keys → Create Key. Es de pago pero muy barato (centavos por uso). Activa generación de ideas, escritura y análisis SEO.' },
            { step: '2', title: 'Serper (gratis 2,500 búsquedas/mes)', color: '#10b981', desc: 'Regístrate en serper.dev → Dashboard → API Key. La cuenta gratuita es suficiente para uso personal. Activa datos reales de Google.' },
            { step: '3', title: 'NewsAPI (gratis plan developer)', color: '#f59e0b', desc: 'Regístrate en newsapi.org → Get API Key. El plan gratuito incluye 100 requests/día, perfecto para tendencias diarias.' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `${item.color}20`, border: `1px solid ${item.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: item.color
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
