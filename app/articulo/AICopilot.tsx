'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, Zap, Brain, Share2, Mail, Target, BarChart2 } from 'lucide-react'
import { callChat, getProfile } from '@/lib/api'

interface Article {
  titulo?: string
  gancho?: string
  subtitulos?: string
  ejemplos?: string
  reflexion?: string
  cta?: string
}

interface Props {
  article: Article
  onApply: (field: string, value: string) => void
}

type Tool = {
  id: string
  label: string
  icon: React.ReactNode
  mode: string
  description: string
  color: string
}

const TOOLS: Tool[] = [
  { id: 'titulos',          label: '10 Títulos',        icon: <Target size={15} />,    mode: 'titulos',          description: 'Genera 10 variaciones del título con distintas fórmulas', color: '#7c3aed' },
  { id: 'hooks',            label: '6 Ganchos',         icon: <Zap size={15} />,       mode: 'hooks',            description: 'Crea 6 aperturas poderosas con distintos estilos narrativos', color: '#f59e0b' },
  { id: 'expandir',         label: 'Expandir sección',  icon: <ChevronDown size={15}/>, mode: 'expandir',        description: 'Enriquece y profundiza cualquier sección seleccionada', color: '#06b6d4' },
  { id: 'reducir',          label: 'Condensar',         icon: <ChevronUp size={15} />,  mode: 'reducir',         description: 'Reduce el contenido al 50% sin perder valor', color: '#10b981' },
  { id: 'reescribir',       label: 'Reescribir',        icon: <Sparkles size={15} />,   mode: 'reescribir',      description: 'Reescribe con voz más potente y directa', color: '#8b5cf6' },
  { id: 'analizar',         label: 'Analizar artículo', icon: <BarChart2 size={15} />,  mode: 'analizar',        description: 'Análisis completo: puntuación, fortalezas y mejoras urgentes', color: '#ec4899' },
  { id: 'social',           label: 'Adaptar a redes',   icon: <Share2 size={15} />,     mode: 'social',          description: 'Genera versiones para Twitter, LinkedIn e Instagram', color: '#0ea5e9' },
  { id: 'newsletter_adapt', label: 'Newsletter',        icon: <Mail size={15} />,       mode: 'newsletter_adapt',description: 'Convierte el artículo en email de newsletter completo', color: '#f97316' },
  { id: 'cta',              label: '8 CTAs',            icon: <Brain size={15} />,      mode: 'cta',             description: 'Genera 8 llamados a la acción para distintos objetivos', color: '#64748b' },
]

interface CopiedState { [key: string]: boolean }

export default function AICopilot({ article, onApply }: Props) {
  const [open, setOpen]           = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<Record<string, unknown> | string | null>(null)
  const [resultMode, setResultMode] = useState<string>('')
  const [copied, setCopied]       = useState<CopiedState>({})
  const [selectedField, setSelectedField] = useState<string>('gancho')
  const [error, setError]         = useState('')

  const articleText = Object.entries(article)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `## ${k.toUpperCase()}\n${v}`)
    .join('\n\n')

  const fieldContent = article[selectedField as keyof Article] || ''

  const run = async (tool: Tool) => {
    setActiveTool(tool.id)
    setLoading(true)
    setResult(null)
    setError('')

    const profile = getProfile()
    const tema    = article.titulo || 'marketing de contenidos'

    let content = ''
    if (['expandir', 'reducir', 'reescribir'].includes(tool.mode)) {
      content = fieldContent || articleText
    } else if (['analizar', 'social', 'newsletter_adapt'].includes(tool.mode)) {
      content = articleText || tema
    } else {
      content = tema
    }

    try {
      const data = await callChat({
        messages: [{ role: 'user', content }],
        mode: tool.mode,
        profile,
      })

      if (data.demo) setError('Modo demo — configura tu API en Configuración para resultados reales')

      if (typeof data.text === 'string') {
        try {
          const parsed = JSON.parse(data.text)
          setResult(parsed)
        } catch {
          setResult(data.text)
        }
      } else {
        setResult(data.text)
      }
      setResultMode(tool.mode)
    } catch {
      setError('Error al contactar la IA. Intenta de nuevo.')
    }
    setLoading(false)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(p => ({ ...p, [key]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000)
  }

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button
      onClick={() => copyText(text, k)}
      style={{
        padding: '3px 8px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
        border: '1px solid var(--border-light)', background: 'transparent',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {copied[k] ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
      {copied[k] ? 'Copiado' : 'Copiar'}
    </button>
  )

  const ApplyBtn = ({ text, field, label }: { text: string; field: string; label?: string }) => (
    <button
      onClick={() => onApply(field, text)}
      style={{
        padding: '3px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
        border: '1px solid rgba(124,58,237,0.4)',
        background: 'rgba(124,58,237,0.07)', color: '#7c3aed',
        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      ✓ {label || 'Aplicar'}
    </button>
  )

  // ── Renderers por modo ──────────────────────────────────────────
  function renderResult() {
    if (!result) return null

    // TEXTO PLANO
    if (typeof result === 'string') {
      return (
        <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <CopyBtn text={result} k="plain" />
            {['expandir','reducir','reescribir'].includes(resultMode) && (
              <ApplyBtn text={result} field={selectedField} />
            )}
          </div>
        </div>
      )
    }

    // TÍTULOS
    if (resultMode === 'titulos' && Array.isArray(result)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(result as Array<{titulo:string;formula:string;por_que_funciona:string}>).map((t, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{t.titulo}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}>{t.formula}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.por_que_funciona}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <CopyBtn text={t.titulo} k={`t${i}`} />
                <ApplyBtn text={t.titulo} field="titulo" label="Usar este título" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // HOOKS
    if (resultMode === 'hooks' && Array.isArray(result)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(result as Array<{estilo:string;hook:string;por_que_engancha:string}>).map((h, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 6, textTransform: 'uppercase' }}>{h.estilo}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 6 }}>&ldquo;{h.hook}&rdquo;</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>💡 {h.por_que_engancha}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <CopyBtn text={h.hook} k={`h${i}`} />
                <ApplyBtn text={h.hook} field="gancho" label="Usar como gancho" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // CTAs
    if (resultMode === 'cta' && Array.isArray(result)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(result as Array<{objetivo:string;cta:string;contexto:string}>).map((c, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>{c.objetivo}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>&ldquo;{c.cta}&rdquo;</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{c.contexto}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <CopyBtn text={c.cta} k={`c${i}`} />
                <ApplyBtn text={c.cta} field="cta" label="Usar este CTA" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // ANÁLISIS
    if (resultMode === 'analizar' && typeof result === 'object' && result !== null) {
      const a = result as Record<string, unknown>
      const score = a.puntuacion_global as number || 0
      const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'var(--bg-base)', borderRadius: 10 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Puntuación global</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                {score >= 80 ? '🟢 Artículo sólido' : score >= 60 ? '🟡 Necesita mejoras' : '🔴 Requiere revisión profunda'}
              </div>
            </div>
          </div>

          {['titular_impacto','gancho','estructura','profundidad','seo_potencial','legibilidad'].map(k => {
            const sec = a[k] as {score:number;feedback:string} | undefined
            if (!sec) return null
            const c = sec.score >= 80 ? '#10b981' : sec.score >= 60 ? '#f59e0b' : '#ef4444'
            return (
              <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, minWidth: 32 }}>{sec.score}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{k.replace('_',' ')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sec.feedback}</div>
                </div>
              </div>
            )
          })}

          {Array.isArray(a.mejoras_urgentes) && (a.mejoras_urgentes as string[]).length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>MEJORAS URGENTES</div>
              {(a.mejoras_urgentes as string[]).map((m, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, padding: '3px 0', borderBottom: i < (a.mejoras_urgentes as string[]).length-1 ? '1px solid rgba(239,68,68,0.1)' : 'none' }}>{m}</div>
              ))}
            </div>
          )}

          {Array.isArray(a.fortalezas) && (
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 8 }}>FORTALEZAS</div>
              {(a.fortalezas as string[]).map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{f}</div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // SOCIAL
    if (resultMode === 'social' && typeof result === 'object' && result !== null) {
      const s = result as Record<string, Record<string, string>>
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {s.twitter_thread && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', marginBottom: 8 }}>🐦 TWITTER / X — HILO</div>
              {Object.values(s.twitter_thread).map((tweet, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, padding: '6px 0', borderBottom: i < Object.values(s.twitter_thread).length-1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i+1}/</span>{tweet}
                </div>
              ))}
              <CopyBtn text={Object.values(s.twitter_thread).join('\n\n')} k="tw" />
            </div>
          )}
          {s.linkedin && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0077b5', marginBottom: 8 }}>💼 LINKEDIN</div>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>{s.linkedin.apertura}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, marginBottom: 6, whiteSpace: 'pre-wrap' }}>{s.linkedin.desarrollo}</div>
              <div style={{ fontSize: 12, color: '#0077b5', marginBottom: 8 }}>{s.linkedin.cierre}</div>
              <CopyBtn text={`${s.linkedin.apertura}\n\n${s.linkedin.desarrollo}\n\n${s.linkedin.cierre}`} k="li" />
            </div>
          )}
          {s.instagram_caption && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e1306c', marginBottom: 8 }}>📸 INSTAGRAM</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{s.instagram_caption.hook}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{s.instagram_caption.cuerpo}</div>
              <div style={{ fontSize: 11, color: '#e1306c', lineHeight: 1.5 }}>{s.instagram_caption.hashtags}</div>
              <div style={{ marginTop: 8 }}>
                <CopyBtn text={`${s.instagram_caption.hook}\n\n${s.instagram_caption.cuerpo}\n\n${s.instagram_caption.hashtags}`} k="ig" />
              </div>
            </div>
          )}
        </div>
      )
    }

    // NEWSLETTER
    if (resultMode === 'newsletter_adapt' && typeof result === 'object' && result !== null) {
      const n = result as Record<string, string>
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'asunto_principal', label: 'Asunto principal', color: '#f97316' },
            { key: 'asunto_alternativo', label: 'Asunto A/B test', color: '#f97316' },
            { key: 'preview_text', label: 'Preview text', color: '#64748b' },
            { key: 'saludo', label: 'Saludo', color: '#7c3aed' },
            { key: 'intro', label: 'Introducción', color: '#7c3aed' },
            { key: 'cuerpo', label: 'Cuerpo del email', color: '#0f172a' },
            { key: 'cta_principal', label: 'Botón CTA', color: '#10b981' },
            { key: 'firma', label: 'Firma', color: '#64748b' },
          ].map(({ key, label, color }) => n[key] && (
            <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n[key]}</div>
              <div style={{ marginTop: 8 }}><CopyBtn text={n[key]} k={key} /></div>
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  const activeTool_ = TOOLS.find(t => t.id === activeTool)

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <button
        className="card"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.04))',
          border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🤖</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>AI Copilot — Herramientas avanzadas</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Títulos · Ganchos · Expandir · Reescribir · Analizar · Redes · Newsletter · CTAs
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)', fontWeight: 700 }}>9 herramientas</span>
          {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>
      </button>

      {open && (
        <div className="card" style={{ marginTop: 8, padding: 20, borderRadius: 12 }}>

          {/* Selector de campo para tools contextuales */}
          {activeTool && ['expandir','reducir','reescribir'].includes(activeTool) && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sección a procesar:</span>
              <select
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'var(--text)', cursor: 'pointer',
                }}
              >
                <option value="gancho">Gancho inicial</option>
                <option value="subtitulos">Subtítulos y estructura</option>
                <option value="ejemplos">Ejemplos e historias</option>
                <option value="reflexion">Reflexión final</option>
                <option value="cta">CTA</option>
              </select>
            </div>
          )}

          {/* Grid de herramientas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 16 }}>
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => run(tool)}
                disabled={loading}
                title={tool.description}
                style={{
                  padding: '10px 12px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                  border: activeTool === tool.id ? `1.5px solid ${tool.color}` : '1px solid var(--border)',
                  background: activeTool === tool.id ? `${tool.color}10` : 'var(--bg-base)',
                  color: activeTool === tool.id ? tool.color : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontWeight: 600, fontSize: 12, transition: 'all 0.15s ease',
                  opacity: loading && activeTool !== tool.id ? 0.5 : 1,
                }}
              >
                {loading && activeTool === tool.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <span style={{ color: tool.color }}>{tool.icon}</span>}
                {tool.label}
              </button>
            ))}
          </div>

          {/* Descripción de la tool activa */}
          {activeTool_ && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 8 }}>
              <strong style={{ color: activeTool_.color }}>{activeTool_.label}:</strong> {activeTool_.description}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#7c3aed' }} />
              Procesando con IA...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: '#f59e0b', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Resultado */}
          {result && !loading && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Resultado — {activeTool_?.label}
              </div>
              {renderResult()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
