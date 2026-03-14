'use client'

import { useState, useRef } from 'react'
import { FileText, Loader2, Copy, Check, Download, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import { getProfile } from '@/lib/api'

interface Props {
  sections: Record<string, string>
  metodologia?: string | null
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:800;color:var(--text);margin:20px 0 8px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:var(--text);margin:16px 0 6px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:900;color:var(--text);margin:0 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px;line-height:1.75;color:var(--text)">')
    .replace(/\n/g, '<br/>')
}

export default function ArticuloFinal({ sections, metodologia }: Props) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState('')
  const [words, setWords]     = useState(0)
  const [model, setModel]     = useState('')
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')
  const [view, setView]       = useState<'markdown' | 'preview'>('preview')
  const streamRef             = useRef<string>('')

  const hasContent = !!(sections.titulo?.trim() && (sections.gancho?.trim() || sections.subtitulos?.trim()))

  const generate = async () => {
    if (!hasContent) return
    setLoading(true)
    setArticle('')
    setError('')
    streamRef.current = ''
    const profile = getProfile()

    try {
      const keys = (() => {
        if (typeof window === 'undefined') return {} as Record<string,string>
        const s = localStorage.getItem('blogos_api_keys')
        return s ? JSON.parse(s) : {}
      })()

      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-stream': 'true' }
      if (keys.anthropic) headers['x-anthropic-key'] = keys.anthropic
      if (keys.groq)      headers['x-groq-key']      = keys.groq
      if (keys.gemini)    headers['x-gemini-key']     = keys.gemini

      const res = await fetch('/api/articulo-final', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sections, profile, metodologia }),
      })

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader  = res.body!.getReader()
        const decoder = new TextDecoder()
        setModel(res.headers.get('X-Model') || 'IA')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { chunk: token } = JSON.parse(data)
              streamRef.current += token
              setArticle(streamRef.current)
              setWords(streamRef.current.split(/\s+/).filter(Boolean).length)
            } catch {}
          }
        }
      } else {
        const data = await res.json()
        if (data.error) { setError(data.error); return }
        setArticle(data.text || '')
        setWords(data.words || 0)
        setModel(data.model || 'IA')
      }
    } catch {
      setError('Error generando el artículo. Intenta de nuevo.')
    }
    setLoading(false)
  }

  const copyMarkdown = () => {
    navigator.clipboard.writeText(article).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadMd = () => {
    const slug = (sections.titulo || 'articulo').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    const blob = new Blob([article], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = `${slug}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header toggle */}
      <button
        className="card"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: article ? 'rgba(16,185,129,0.04)' : 'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(6,182,212,0.03))',
          border: article ? '1.5px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.2)', borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Artículo Final Publicable</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {article
                ? `${words} palabras · generado con ${model}`
                : 'Genera el artículo completo en prosa lista para publicar'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {article && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>✓ Listo</span>}
          {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>
      </button>

      {open && (
        <div className="card" style={{ marginTop: 8, padding: 20, borderRadius: 12 }}>

          {/* Botón de generar */}
          {!article && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                Usa todas las secciones que escribiste para generar un artículo completo de <strong>900-1200 palabras</strong>, con prosa fluida y lista para publicar en tu blog.
              </p>
              {!hasContent && (
                <div style={{ fontSize: 12, color: '#f59e0b', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                  ⚠️ Escribe al menos el título y el gancho antes de generar
                </div>
              )}
              <button
                onClick={generate}
                disabled={loading || !hasContent}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                  background: hasContent ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'var(--bg-base)',
                  color: hasContent ? 'white' : 'var(--text-muted)',
                  border: 'none', cursor: hasContent ? 'pointer' : 'not-allowed',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {loading ? 'Escribiendo el artículo...' : 'Generar artículo final'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#dc2626', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 12 }}>
              ❌ {error}
            </div>
          )}

          {/* Artículo generado */}
          {article && (
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', borderRadius: 8, padding: 4, border: '1px solid var(--border)' }}>
                  {(['preview', 'markdown'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: view === v ? '#7c3aed' : 'transparent',
                        color: view === v ? 'white' : 'var(--text-muted)',
                      }}
                    >{v === 'preview' ? '👁 Preview' : '{ } Markdown'}</button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                  📊 {words} palabras · ~{Math.ceil(words / 200)} min lectura · {model}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button
                    onClick={generate}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8,
                      border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-muted)',
                      fontSize: 12, cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    Regenerar
                  </button>
                  <button
                    onClick={copyMarkdown}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8,
                      border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-muted)',
                      fontSize: 12, cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={downloadMd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8,
                      border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.07)', color: '#059669',
                      fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    <Download size={12} /> Descargar .md
                  </button>
                </div>
              </div>

              {/* Contenido */}
              {view === 'preview' ? (
                <div
                  style={{ padding: '20px 24px', background: '#fafafa', borderRadius: 10, border: '1px solid var(--border)', maxHeight: 600, overflowY: 'auto', lineHeight: 1.75 }}
                  dangerouslySetInnerHTML={{
                    __html: `<p style="margin:0 0 12px;line-height:1.75;color:var(--text)">${markdownToHtml(article)}</p>`,
                  }}
                />
              ) : (
                <textarea
                  value={article}
                  readOnly
                  style={{
                    width: '100%', height: 500, padding: '16px', borderRadius: 10, border: '1px solid var(--border)',
                    background: '#1e1e2e', color: '#e2e8f0', fontSize: 13, lineHeight: 1.6,
                    fontFamily: 'monospace', resize: 'vertical',
                  }}
                />
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !article && (
            <div style={{ padding: '20px 0' }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-pulse" style={{
                  height: 14, background: 'var(--border)', borderRadius: 6, marginBottom: 10,
                  width: i % 2 === 0 ? '85%' : '100%',
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
