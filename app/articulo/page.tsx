'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Check, Copy, Download, Save, ChevronDown, ChevronUp, Loader2, AlertCircle, X, Wand2 } from 'lucide-react'
import { getProfile as getProfileFn } from '@/lib/api'
import NewsletterSend from '@/app/components/NewsletterSend'
import MetodologiasPicker from './MetodologiasPicker'
import type { Metodologia } from './metodologias'
import AICopilot from './AICopilot'

type Section = {
  id: string
  title: string
  emoji: string
  description: string
  placeholder: string
  tip: string
}

const SECTIONS: Section[] = [
  {
    id: 'titulo',
    title: 'Título Atractivo',
    emoji: '🎯',
    description: 'El título es lo primero que ve tu lector. Debe despertar curiosidad y comunicar el beneficio.',
    placeholder: 'Escribe un título que nadie pueda ignorar...',
    tip: 'Usa números (7 formas...), preguntas (¿Por qué...?) o contraste (Lo que nadie dice sobre...)',
  },
  {
    id: 'gancho',
    title: 'Gancho Inicial',
    emoji: '🪝',
    description: 'Las primeras 2-3 oraciones deciden si el lector sigue. Engancha con una historia, dato o pregunta poderosa.',
    placeholder: 'Comienza con algo que haga al lector decir "¡Necesito leer esto!"...',
    tip: 'Técnica PAS: Problema → Agitación → Solución. O empieza con una historia real.',
  },
  {
    id: 'subtitulos',
    title: 'Subtítulos y Estructura',
    emoji: '📋',
    description: 'Los subtítulos son el esqueleto de tu artículo. El lector los escanea antes de leer el texto.',
    placeholder: 'Lista tus subtítulos principales:\n\n1. Por qué...\n2. Cómo...\n3. El error que...\n4. Lo que nadie dice...',
    tip: 'Cada subtítulo debe poder leerse de forma independiente y generar curiosidad.',
  },
  {
    id: 'ejemplos',
    title: 'Ejemplos e Historias',
    emoji: '📖',
    description: 'Los ejemplos hacen tangible lo abstracto. Las historias crean conexión emocional.',
    placeholder: 'Escribe las historias o ejemplos que ilustrarán cada punto del artículo...',
    tip: 'Una historia personal bien contada vale más que 10 estadísticas. Sé específico con los detalles.',
  },
  {
    id: 'reflexion',
    title: 'Reflexión Final',
    emoji: '🧠',
    description: 'El cierre que hace al lector pensar diferente. Aquí está el valor diferencial de tu artículo.',
    placeholder: 'La conclusión más importante, la perspectiva única, el insight que solo tú puedes dar...',
    tip: 'Conecta el final con el principio. Cierra el loop que abriste en el gancho.',
  },
  {
    id: 'cta',
    title: 'Llamado a la Acción (CTA)',
    emoji: '🚀',
    description: '¿Qué quieres que haga el lector después de leer? Sé específico y da una sola instrucción.',
    placeholder: 'Ej: Comparte este artículo con alguien que lo necesite / Suscríbete para recibir más contenido como este...',
    tip: 'Un CTA claro y específico convierte 3x más que uno genérico. Usa verbos de acción.',
  },
]

type Article = {
  id: string
  titulo: string
  gancho: string
  subtitulos: string
  ejemplos: string
  reflexion: string
  cta: string
  createdAt: string
}

export default function ArticuloPage() {
  const [content, setContent] = useState<Record<string, string>>({
    titulo: '',
    gancho: '',
    subtitulos: '',
    ejemplos: '',
    reflexion: '',
    cta: '',
  })
  const [activeSection, setActiveSection] = useState(0)
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [aiError, setAiError] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<Record<string, string> | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generateProgress, setGenerateProgress] = useState<string>('')
  const [seoScore, setSeoScore] = useState<number | null>(null)
  const seoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')
  const [autoSaveMsg, setAutoSaveMsg] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showNewsletter, setShowNewsletter] = useState(false)
  const [metodologiaId, setMetodologiaId] = useState<string | null>(null)
  const [showThreadModal, setShowThreadModal] = useState(false)
  const [threadTweets, setThreadTweets] = useState<string[]>([])
  const [threadLoading, setThreadLoading] = useState(false)

  // Contador de palabras y tiempo de lectura
  function getWordStats(c: Record<string, string>) {
    const fullText = Object.values(c).join(' ')
    const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0
    const readingMin = Math.max(1, Math.ceil(words / 200))
    return { words, readingMin }
  }
  const wordStats = getWordStats(content)

  useEffect(() => {
    // Leer params SIN useSearchParams (evita BAILOUT_TO_CLIENT_SIDE_RENDERING)
    try {
      const params = new URLSearchParams(window.location.search)
      const idea = params.get('idea') || ''
      if (idea) {
        setContent(prev => ({ ...prev, titulo: decodeURIComponent(idea) }))
      }
    } catch {}

    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))

    // Restaurar borrador guardado automáticamente
    const draft = localStorage.getItem('blogos_article_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        // Solo restaurar si hay contenido y no hay idea desde URL
        const params = new URLSearchParams(window.location.search)
        if (!params.get('idea') && Object.values(parsed).some((v: unknown) => String(v).trim())) {
          setContent(parsed)
        }
      } catch {}
    }
  }, [])

  // Auto-save cada 30 segundos si hay cambios
  useEffect(() => {
    if (!isDirty) return
    const timer = setInterval(() => {
      localStorage.setItem('blogos_article_draft', JSON.stringify(content))
      setAutoSaveMsg('Borrador guardado automáticamente')
      setIsDirty(false)
      setTimeout(() => setAutoSaveMsg(''), 3000)
    }, 30000)
    return () => clearInterval(timer)
  }, [isDirty, content])

  // Marcar como dirty cuando cambia el contenido
  const handleContentChange = (sectionId: string, value: string) => {
    setContent(prev => {
      const next = { ...prev, [sectionId]: value }
      updateSeoScore(next)
      return next
    })
    setIsDirty(true)
  }

  const completedSections = SECTIONS.filter(s => content[s.id]?.trim().length > 0).length
  const progress = (completedSections / SECTIONS.length) * 100

  // Genera una sección con contexto completo del artículo + streaming
  const generateWithAI = async (sectionId: string, currentContent?: Record<string, string>) => {
    const ctx = currentContent || content
    setAiLoading(prev => ({ ...prev, [sectionId]: true }))
    setAiError(prev => ({ ...prev, [sectionId]: '' }))

    const niche   = profile?.niche    || 'marketing digital'
    const audience= profile?.audience || 'emprendedores'
    const style   = profile?.style    || 'profesional pero cercano'

    // Contexto completo del artículo para que la IA tenga coherencia total
    const articleContext = SECTIONS
      .filter(s => s.id !== sectionId && ctx[s.id]?.trim())
      .map(s => `${s.title.toUpperCase()}: ${ctx[s.id]}`)
      .join('\n\n')

    const sectionMeta: Record<string, { instruccion: string; palabras: string }> = {
      titulo:    { instruccion: 'Genera UN título magnético que genere curiosidad, use números o contraste, y sea imposible de ignorar.', palabras: '10-15 palabras' },
      gancho:    { instruccion: 'Escribe las primeras 3-4 oraciones del artículo. Comienza con una historia, dato impactante o pregunta que genere tensión inmediata. Aplica PAS o In Medias Res.', palabras: '60-90 palabras' },
      subtitulos:{ instruccion: 'Crea 5-7 subtítulos H2 con la estructura completa del artículo. Cada subtítulo debe ser curioso, accionable y escaneable. Numera cada uno.', palabras: '7-10 palabras por subtítulo' },
      ejemplos:  { instruccion: 'Escribe 2-3 ejemplos concretos, historias o casos reales que ilustren los puntos del artículo. Usa nombres reales, números y detalles específicos.', palabras: '150-200 palabras' },
      reflexion: { instruccion: 'Escribe el párrafo de cierre que cambia la perspectiva del lector. Conecta con el gancho inicial y deja un insight memorable y único.', palabras: '80-120 palabras' },
      cta:       { instruccion: 'Escribe UN llamado a la acción claro, específico y urgente. Usa verbo de acción. Explica el beneficio de actuar ahora.', palabras: '20-40 palabras' },
    }

    const meta  = sectionMeta[sectionId] || { instruccion: 'Genera el contenido de esta sección.', palabras: '150 palabras' }
    const prompt = `CONTEXTO DEL ARTÍCULO:
Nicho: ${niche} | Audiencia: ${audience} | Estilo: ${style}
${articleContext ? `\nRESTO DEL ARTÍCULO YA ESCRITO:\n${articleContext}\n` : ''}
TAREA: Genera la sección "${sectionId.toUpperCase()}" del artículo.
${meta.instruccion}
Longitud objetivo: ${meta.palabras}.
Mantén coherencia con el resto del artículo.
Tono: ${style}.
DEVUELVE SOLO el contenido de la sección. Sin etiquetas, sin explicaciones.`

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
      if (keys.openai)    headers['x-openai-key']     = keys.openai
      if (keys.mistral)   headers['x-mistral-key']    = keys.mistral

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'estructura', profile }),
      })

      // Si streaming está disponible, leer token a token
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader  = res.body!.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        setContent(prev => ({ ...prev, [sectionId]: '' }))

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const { chunk: token } = JSON.parse(data)
                accumulated += token
                setContent(prev => ({ ...prev, [sectionId]: accumulated }))
              } catch {}
            }
          }
        }
        setIsDirty(true)
      } else {
        // Fallback sin streaming
        const data = await res.json()
        if (data?.text) {
          setContent(prev => ({ ...prev, [sectionId]: data.text.trim() }))
          setIsDirty(true)
        }
        if (data?.demo) {
          setAiError(prev => ({ ...prev, [sectionId]: 'Modo demo — configura tu API en Configuración' }))
        }
      }
    } catch {
      setAiError(prev => ({ ...prev, [sectionId]: 'Error al generar. Intenta de nuevo.' }))
    }
    setAiLoading(prev => ({ ...prev, [sectionId]: false }))
  }

  // Genera TODO el artículo sección por sección con contexto encadenado
  const generateFullArticle = async () => {
    if (!content.titulo?.trim()) {
      setGlobalMsg('Escribe un título primero para generar el artículo completo')
      setTimeout(() => setGlobalMsg(''), 3000)
      return
    }
    setGeneratingAll(true)
    const sectionsToGenerate = SECTIONS.filter(s => s.id !== 'titulo')
    let accumulated = { ...content }

    for (const section of sectionsToGenerate) {
      setGenerateProgress(`Generando: ${section.emoji} ${section.title}...`)
      await generateWithAI(section.id, accumulated)
      // Leer el estado actualizado para encadenar contexto
      accumulated = { ...accumulated, [section.id]: document.querySelector<HTMLTextAreaElement>(`[data-section="${section.id}"]`)?.value || accumulated[section.id] || '' }
      await new Promise(r => setTimeout(r, 300))
    }

    setGenerateProgress('')
    setGeneratingAll(false)
    setGlobalMsg('🎉 Artículo generado completo')
    setTimeout(() => setGlobalMsg(''), 3000)
  }

  // Score SEO en tiempo real (debounced 2s)
  const updateSeoScore = (c: Record<string, string>) => {
    if (seoTimer.current) clearTimeout(seoTimer.current)
    seoTimer.current = setTimeout(() => {
      const text = Object.values(c).join(' ')
      const words = text.trim().split(/\s+/).filter(Boolean).length
      let score = 0
      if (c.titulo?.length > 20 && c.titulo?.length < 70) score += 20
      if (c.gancho?.length > 50) score += 15
      if (c.subtitulos?.split('\n').length >= 3) score += 15
      if (c.ejemplos?.length > 100) score += 15
      if (c.reflexion?.length > 50) score += 15
      if (c.cta?.length > 20) score += 10
      if (words > 300) score += 5
      if (words > 600) score += 5
      setSeoScore(Math.min(score, 100))
    }, 1500)
  }

  const saveArticle = () => {
    if (!content.titulo?.trim()) {
      setGlobalMsg('Escribe al menos el título antes de guardar.')
      setTimeout(() => setGlobalMsg(''), 3000)
      return
    }
    const articles = JSON.parse(localStorage.getItem('blogos_articles') || '[]')
    const article: Article = {
      id: `art-${Date.now()}`,
      ...content as Omit<Article, 'id' | 'createdAt'>,
      createdAt: new Date().toISOString(),
    }
    articles.push(article)
    localStorage.setItem('blogos_articles', JSON.stringify(articles))
    setSaved(true)
    setGlobalMsg('¡Artículo guardado! 🎉')
    setTimeout(() => { setSaved(false); setGlobalMsg('') }, 3000)
  }

  const copyAll = () => {
    const full = `# ${content.titulo}\n\n${content.gancho}\n\n${content.subtitulos}\n\n${content.ejemplos}\n\n---\n\n${content.reflexion}\n\n**${content.cta}**`
    navigator.clipboard.writeText(full).catch(() => {})
    setCopied(true)
    setGlobalMsg('Contenido copiado al portapapeles 📋')
    setTimeout(() => { setCopied(false); setGlobalMsg('') }, 3000)
  }

  const downloadMarkdown = () => {
    const full = `# ${content.titulo}\n\n${content.gancho}\n\n${content.subtitulos}\n\n${content.ejemplos}\n\n---\n\n${content.reflexion}\n\n**CTA: ${content.cta}**`
    const blob = new Blob([full], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.titulo?.slice(0, 30) || 'articulo'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateThread = async () => {
    setThreadLoading(true)
    try {
      const res = await fetch('/api/twitter-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: content.titulo,
          gancho: content.gancho,
          subtitulos: content.subtitulos,
          reflexion: content.reflexion,
          cta: content.cta,
        }),
      })
      const data = await res.json()
      setThreadTweets(data.tweets || [])
      setShowThreadModal(true)
    } catch {
      setGlobalMsg('Error al generar thread')
      setTimeout(() => setGlobalMsg(''), 3000)
    }
    setThreadLoading(false)
  }

  const shareLinkedIn = () => {
    const profileData = getProfileFn()
    const blogUrl = profileData?.blog || profileData?.website || ''
    if (blogUrl) {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`, '_blank')
    } else {
      // Copy content for LinkedIn
      const hashtags = profile?.niche ? `#${profile.niche.replace(/\s+/g, '')} #BlogOS #ContentMarketing` : '#BlogOS #ContentMarketing'
      const linkedinText = `${content.titulo}\n\n${content.gancho}\n\n${hashtags}`
      navigator.clipboard.writeText(linkedinText).catch(() => {})
      setGlobalMsg('Contenido copiado para LinkedIn (no hay URL de blog en tu perfil)')
      setTimeout(() => setGlobalMsg(''), 3000)
    }
  }

  const handleSelectMetodologia = (m: Metodologia) => {
    setMetodologiaId(m.id)
    const estructura = m.estructura.join('\n')
    setContent(prev => ({ ...prev, subtitulos: estructura }))
    setIsDirty(true)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>✍️ Nuevo Artículo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Metodología BlogOS — 6 secciones para un artículo de alto nivel
        </p>
      </div>

      {/* Mensaje global */}
      {globalMsg && (
        <div style={{
          marginBottom: 16, padding: '10px 14px',
          background: globalMsg.includes('Error') || globalMsg.includes('Escribe') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${globalMsg.includes('Error') || globalMsg.includes('Escribe') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          borderRadius: 8, fontSize: 13,
          color: globalMsg.includes('Error') || globalMsg.includes('Escribe') ? '#f87171' : '#34d399',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={14} />
          {globalMsg}
        </div>
      )}

      {/* Metodologías */}
      <MetodologiasPicker
        selectedId={metodologiaId}
        onSelect={handleSelectMetodologia}
      />

      {/* AI Copilot */}
      <AICopilot
        article={content as { titulo?: string; gancho?: string; subtitulos?: string; ejemplos?: string; reflexion?: string; cta?: string }}
        onApply={(field, value) => {
          setContent(prev => ({ ...prev, [field]: value }))
          setIsDirty(true)
        }}
      />

      {/* Progress */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Progreso del artículo</span>
          <span style={{ fontSize: 13, color: completedSections === 6 ? '#34d399' : '#a78bfa' }}>
            {completedSections}/6 secciones {completedSections === 6 ? '✅ Completo' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {seoScore !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SEO</span>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: 12,
                background: seoScore >= 80 ? 'rgba(16,185,129,0.12)' : seoScore >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                color: seoScore >= 80 ? '#059669' : seoScore >= 50 ? '#d97706' : '#dc2626',
                border: `2px solid ${seoScore >= 80 ? 'rgba(16,185,129,0.4)' : seoScore >= 50 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
              }}>
                {seoScore}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <span key={s.id} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 12,
              background: content[s.id]?.trim() ? 'rgba(16,185,129,0.15)' : 'var(--bg-base)',
              border: `1px solid ${content[s.id]?.trim() ? 'rgba(16,185,129,0.3)' : 'var(--border-light)'}`,
              color: content[s.id]?.trim() ? '#34d399' : 'var(--text-muted)',
            }}>
              {content[s.id]?.trim() ? '✓' : '○'} {s.emoji} {s.title}
            </span>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn-primary" onClick={saveArticle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? '¡Guardado!' : 'Guardar'}
        </button>
        <button
          onClick={generateFullArticle}
          disabled={generatingAll || !content.titulo?.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: generatingAll || !content.titulo?.trim() ? 'not-allowed' : 'pointer',
            background: generatingAll ? 'rgba(124,58,237,0.1)' : 'linear-gradient(135deg,#7c3aed,#ec4899)',
            color: generatingAll ? '#7c3aed' : 'white',
            border: generatingAll ? '1px solid rgba(124,58,237,0.3)' : 'none',
            opacity: !content.titulo?.trim() ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {generatingAll ? (generateProgress || 'Generando...') : '🪄 Generar artículo completo'}
        </button>
        <button className="btn-secondary" onClick={copyAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copiado!' : 'Copiar todo'}
        </button>
        <button className="btn-secondary" onClick={downloadMarkdown} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={15} />
          Descargar .md
        </button>
        <button
          className="btn-secondary"
          onClick={() => setShowPreview(!showPreview)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showPreview ? 'Ocultar preview' : 'Ver preview'}
        </button>

        <button className="btn-secondary" onClick={generateThread} disabled={threadLoading || !content.titulo?.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {threadLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          🐦 Thread
        </button>
        <button className="btn-secondary" onClick={shareLinkedIn}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          💼 LinkedIn
        </button>
        <button className="btn-secondary" onClick={() => setShowNewsletter(!showNewsletter)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          📧 Newsletter
        </button>

        {/* Contador de palabras + autosave */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {autoSaveMsg && (
            <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={11} /> {autoSaveMsg}
            </span>
          )}
          {wordStats.words > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              📝 {wordStats.words.toLocaleString()} palabras · {wordStats.readingMin} min de lectura
            </span>
          )}
        </div>
      </div>

      {/* Newsletter Send */}
      {showNewsletter && (
        <NewsletterSend
          defaultSubject={content.titulo}
          content={`${content.gancho}\n\n${content.subtitulos}\n\n${content.ejemplos}\n\n${content.reflexion}\n\n${content.cta}`}
        />
      )}

      {/* Twitter Thread Modal */}
      {showThreadModal && threadTweets.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>🐦 Thread generado ({threadTweets.length} tweets)</div>
            <button onClick={() => setShowThreadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {threadTweets.map((tweet, i) => (
              <div key={i} style={{
                padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 10,
                border: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text)',
                lineHeight: 1.5,
              }}>
                {tweet}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  {tweet.length} caracteres
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => {
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(threadTweets[0])}`, '_blank')
            }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              🐦 Publicar en X
            </button>
            <button className="btn-secondary" onClick={() => {
              navigator.clipboard.writeText(threadTweets.join('\n\n---\n\n'))
              setGlobalMsg('Thread copiado al portapapeles')
              setTimeout(() => setGlobalMsg(''), 2000)
            }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Copy size={14} /> Copiar todo
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            {content.titulo || '(Sin título)'}
          </h2>
          {content.gancho && (
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12, fontSize: 14, borderLeft: '3px solid #7c3aed', paddingLeft: 12 }}>
              {content.gancho}
            </p>
          )}
          {content.subtitulos && (
            <pre style={{ color: 'var(--text)', fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: 12, fontFamily: 'inherit' }}>
              {content.subtitulos}
            </pre>
          )}
          {content.ejemplos && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{content.ejemplos}</p>
          )}
          {content.reflexion && (
            <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
              💭 {content.reflexion}
            </p>
          )}
          {content.cta && (
            <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.1)', borderRadius: 8, color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>
              🚀 {content.cta}
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map((section, index) => (
          <div key={section.id} className="card" style={{
            border: activeSection === index ? '1px solid #7c3aed' : '1px solid var(--border)',
            transition: 'all 0.2s',
          }}>
            {/* Section header */}
            <div
              style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setActiveSection(activeSection === index ? -1 : index)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: content[section.id]?.trim() ? 'rgba(16,185,129,0.2)' : 'var(--bg-base)',
                  border: `1px solid ${content[section.id]?.trim() ? 'rgba(16,185,129,0.4)' : 'var(--border-light)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {content[section.id]?.trim() ? '✓' : section.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {index + 1}. {section.title}
                  </div>
                  {content[section.id]?.trim() && activeSection !== index && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, maxWidth: 380 }}>
                      {content[section.id].slice(0, 80)}...
                    </div>
                  )}
                </div>
              </div>
              {activeSection === index
                ? <ChevronUp size={18} color="var(--text-muted)" />
                : <ChevronDown size={18} color="var(--text-muted)" />
              }
            </div>

            {/* Section content */}
            {activeSection === index && (
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {section.description}
                </p>
                <div style={{
                  padding: '10px 12px', background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 12,
                }}>
                  <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginBottom: 3 }}>💡 TIP</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{section.tip}</div>
                </div>
                <textarea
                  className="textarea-field"
                  placeholder={section.placeholder}
                  value={content[section.id]}
                  onChange={e => handleContentChange(section.id, e.target.value)}
                  style={{ minHeight: section.id === 'subtitulos' || section.id === 'ejemplos' ? 160 : 120 }}
                  aria-label={`${section.title} — sección ${index + 1} de ${SECTIONS.length}`}
                  data-section={section.id}
                />

                {/* Error inline */}
                {aiError[section.id] && (
                  <div style={{
                    marginTop: 8, fontSize: 12, color: '#f59e0b',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertCircle size={13} />
                    {aiError[section.id]}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {content[section.id]?.length || 0} caracteres
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => generateWithAI(section.id)}
                      disabled={aiLoading[section.id]}
                      style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {aiLoading[section.id]
                        ? <><Loader2 size={14} className="animate-spin" /> Generando...</>
                        : <><Sparkles size={14} /> Generar con IA</>
                      }
                    </button>
                    {index < SECTIONS.length - 1 && content[section.id]?.trim() && (
                      <button
                        className="btn-primary"
                        onClick={() => setActiveSection(index + 1)}
                        style={{ fontSize: 12, padding: '7px 14px' }}
                      >
                        Siguiente →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completed */}
      {completedSections === 6 && (
        <div style={{
          marginTop: 20, padding: '16px 20px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>¡Artículo completo!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Guárdalo, cópialo o descárgalo. ¡Listo para publicar!
          </div>
        </div>
      )}
    </div>
  )
}
