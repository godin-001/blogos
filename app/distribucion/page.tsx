'use client'
import { useState } from 'react'
import { callChat, getProfile } from '@/lib/api'

const FORMATS = [
  { id: 'social', icon: '📱', label: '5 Posts Sociales', platform: 'Instagram / LinkedIn / Facebook',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nCrea 5 posts para redes sociales (Instagram/LinkedIn) basados en este artículo. Cada post debe:\n- Tener un gancho diferente\n- Ser autocontenido (funciona sin leer el artículo)\n- Terminar con CTA al artículo\n- Máximo 150 palabras por post\n\nFormato: POST 1:, POST 2:, etc.` },
  { id: 'stories', icon: '⭕', label: '3 Ideas de Stories/Reels', platform: 'Instagram / TikTok',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nCrea 3 guiones breves para Stories o Reels de 30-60 segundos basados en este artículo. Cada uno con: gancho (3s), contenido (20s), CTA (7s). Formato: REEL 1:, REEL 2:, REEL 3:` },
  { id: 'newsletter', icon: '📧', label: 'Newsletter Completo', platform: 'Email',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nEscribe un email newsletter basado en este artículo. Incluye: asunto del email (3 opciones), preview text, saludo personal, intro con gancho, resumen de 3 puntos clave del artículo, insight exclusivo no incluido en el artículo, y CTA final. Tono: personal, directo, como si escribieras a un amigo.` },
  { id: 'thread', icon: '🧵', label: '3 Thread Ideas', platform: 'Twitter/X',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nCrea 3 threads de Twitter/X basados en este artículo. Cada thread: tweet de apertura (gancho), 5-7 tweets de contenido numerados, tweet de cierre con CTA. Máximo 280 chars por tweet. Formato: THREAD 1, THREAD 2, THREAD 3.` },
  { id: 'video', icon: '🎬', label: 'Guión de Video', platform: 'YouTube / Podcast',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nCrea un guión de video de YouTube de 8-12 minutos basado en este artículo. Incluye: intro con gancho (30s), contexto/por qué importa (1min), 3-4 puntos principales con ejemplos (6-8min), conclusión + CTA a suscribirse (1min). Indica timestamps aproximados.` },
  { id: 'carousel', icon: '🎠', label: 'Guión de Carrusel', platform: 'LinkedIn / Instagram',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nCrea un carrusel de 8-10 slides basado en este artículo. Slide 1: portada con gancho. Slides 2-8: un punto clave cada uno (titular + 2-3 bullets). Slide final: CTA. Cada slide: título + texto corto (máx 50 palabras). Formato: SLIDE 1:, SLIDE 2:, etc.` },
  { id: 'community', icon: '💬', label: 'Respuesta Comunidad', platform: 'Quora / Reddit / Grupos',
    prompt: (t: string, s: string, n: string) => `Artículo: "${t}"\nSumario: ${s}\nNicho: ${n}\n\nEscribe 2 respuestas para Quora o Reddit basadas en el artículo. Deben: responder una pregunta común sobre el tema, dar valor real sin sonar a spam, mencionar el artículo de forma natural al final. Formato: RESPUESTA 1 (pregunta sugerida), RESPUESTA 2 (pregunta sugerida).` },
]

export default function DistribucionPage() {
  const [titulo, setTitulo] = useState('')
  const [sumario, setSumario] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string|null>(null)
  const [copied, setCopied] = useState<string|null>(null)
  const [expanded, setExpanded] = useState<string|null>(null)

  const profile = typeof window !== 'undefined' ? getProfile() : null
  const niche = profile?.niche || 'emprendimiento'

  const generate = async (formatId: string) => {
    if (!titulo.trim()) return
    const f = FORMATS.find(f => f.id === formatId)
    if (!f) return
    setLoading(formatId)
    try {
      const res = await callChat(f.prompt(titulo, sumario, niche), 'estructura', profile)
      setResults(prev => ({ ...prev, [formatId]: res.text }))
      setExpanded(formatId)
    } catch (e) {
      setResults(prev => ({ ...prev, [formatId]: 'Error generando. Intenta de nuevo.' }))
    }
    setLoading(null)
  }

  const generateAll = async () => {
    for (const f of FORMATS) {
      await generate(f.id)
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const done = Object.keys(results).length

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📡 Distribución Omnicanal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          1 artículo → 7 formatos. Nunca crees contenido para un solo canal. Cada artículo debe trabajar en todos lados al mismo tiempo.
        </p>
      </div>

      {/* Progress */}
      {done > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
              {done} de {FORMATS.length} formatos generados
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${done/FORMATS.length*100}%`, background: '#10b981', transition: 'width .4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: 20, borderRadius: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', marginBottom: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>TÍTULO DEL ARTÍCULO *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="ej: 7 formas de monetizar tu blog en 2026"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>RESUMEN DEL ARTÍCULO</label>
            <input value={sumario} onChange={e => setSumario(e.target.value)}
              placeholder="2-3 líneas del contenido principal..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }} />
          </div>
        </div>
        <button onClick={generateAll} disabled={!titulo.trim() || loading !== null}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            background: titulo.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'var(--border)',
            color: titulo.trim() ? 'white' : 'var(--text-muted)',
          }}>
          {loading ? `⏳ Generando ${FORMATS.find(f=>f.id===loading)?.label}...` : '⚡ Generar todo el contenido'}
        </button>
        <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>O genera formato por formato ↓</span>
      </div>

      {/* Formats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FORMATS.map(f => (
          <div key={f.id} style={{
            borderRadius: 14, background: 'var(--bg-card)',
            border: `1px solid ${results[f.id] ? 'rgba(124,58,237,.4)' : 'var(--border)'}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.platform}</div>
                </div>
                {results[f.id] && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Listo</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {results[f.id] && (
                  <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                    {expanded === f.id ? 'Ocultar' : 'Ver'}
                  </button>
                )}
                <button onClick={() => generate(f.id)} disabled={!titulo.trim() || loading === f.id}
                  style={{
                    padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: results[f.id] ? 'rgba(124,58,237,.15)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    color: results[f.id] ? '#a78bfa' : 'white',
                  }}>
                  {loading === f.id ? '...' : results[f.id] ? '↺ Regenerar' : 'Generar'}
                </button>
              </div>
            </div>
            {expanded === f.id && results[f.id] && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                <pre style={{
                  marginTop: 14, padding: 16, borderRadius: 10,
                  background: 'var(--bg-base)', border: '1px solid var(--border)',
                  fontSize: 13, lineHeight: 1.65, color: 'var(--text)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto',
                }}>
                  {results[f.id]}
                </pre>
                <button onClick={() => copy(results[f.id], f.id)}
                  style={{
                    marginTop: 10, padding: '8px 16px', borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: copied === f.id ? 'rgba(16,185,129,.15)' : 'none',
                    color: copied === f.id ? '#10b981' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                  {copied === f.id ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
