'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Check, Copy, Download, Save, ChevronDown, ChevronUp, Loader2, AlertCircle, X } from 'lucide-react'
import { callChat, getStoredKeys, getProfile as getProfileFn } from '@/lib/api'
import NewsletterSend from '@/app/components/NewsletterSend'

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
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')
  const [autoSaveMsg, setAutoSaveMsg] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showNewsletter, setShowNewsletter] = useState(false)
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
    setContent(prev => ({ ...prev, [sectionId]: value }))
    setIsDirty(true)
  }

  const completedSections = SECTIONS.filter(s => content[s.id]?.trim().length > 0).length
  const progress = (completedSections / SECTIONS.length) * 100

  const generateWithAI = async (sectionId: string) => {
    setAiLoading(prev => ({ ...prev, [sectionId]: true }))
    setAiError(prev => ({ ...prev, [sectionId]: '' }))
    try {
      const contextMsg = `Artículo: "${content.titulo || 'Sin título aún'}"
Nicho: ${profile?.niche || 'marketing digital'}
Sección a generar: ${sectionId}
Contexto del artículo:
- Título: ${content.titulo}
- Gancho: ${content.gancho}
- Subtítulos: ${content.subtitulos}

Genera contenido de alta calidad para la sección "${sectionId}".
Máximo 200 palabras. Estilo: ${profile?.style || 'profesional pero cercano'}.
Solo el contenido de la sección, sin explicaciones adicionales.`

      const data = await callChat({
        mode: 'estructura',
        profile,
        messages: [{ role: 'user', content: contextMsg }],
      })

      if (data?.text) {
        setContent(prev => ({ ...prev, [sectionId]: data.text.trim() }))
      } else {
        // fallback de mock
        const mocks: Record<string, string> = {
          titulo: content.titulo || '7 estrategias de content marketing que duplican tu tráfico en 90 días',
          gancho: 'El 80% de los bloggers abandonan en los primeros 6 meses. No porque no tengan talento—sino porque nadie les enseñó el sistema correcto. Hoy te doy exactamente ese sistema.',
          subtitulos: '1. Por qué el contenido genérico ya no funciona\n2. La estrategia del pillar content\n3. Cómo distribuir un artículo en 7 plataformas\n4. El error más costoso del content marketing\n5. Tu plan de los próximos 30 días',
          ejemplos: 'Un cliente mío, Carlos (agencia de marketing en CDMX), pasó de 200 a 15,000 visitas mensuales en 4 meses usando exactamente estos principios. Su secreto: un solo artículo pilar de 3,000 palabras del que derivó 8 piezas de contenido más corto.',
          reflexion: 'El content marketing no es sobre crear más contenido. Es sobre crear el contenido correcto, para la persona correcta, en el momento correcto. Cuando entiendas esto, todo cambia.',
          cta: '¿Cuál de estas estrategias vas a implementar esta semana? Déjame tu respuesta en los comentarios.',
        }
        setContent(prev => ({ ...prev, [sectionId]: mocks[sectionId] || 'Contenido generado.' }))
      }
    } catch {
      setAiError(prev => ({ ...prev, [sectionId]: 'Usando ejemplo — IA temporalmente no disponible' }))
      // Aún así colocar contenido de ejemplo
      const mocks: Record<string, string> = {
        titulo: '7 estrategias que duplican tu tráfico orgánico',
        gancho: 'Hay un patrón que separa los blogs que generan $10K/mes de los que generan $0. Te lo voy a mostrar en menos de 5 minutos.',
        subtitulos: '1. El error #1 que cometen el 90% de los bloggers\n2. La fórmula de los artículos virales\n3. Cómo convertir lectores en suscriptores\n4. Tu calendario editorial en 15 minutos',
        ejemplos: 'Caso real: María duplicó su tráfico en 60 días publicando solo 1 artículo semanal—pero con esta metodología específica.',
        reflexion: 'No necesitas más tiempo ni más ideas. Necesitas un sistema. Este es tu sistema.',
        cta: 'Comparte este artículo con un blogger que lo necesite. Puede cambiar su negocio.',
      }
      setContent(prev => ({ ...prev, [sectionId]: mocks[sectionId] || 'Contenido de ejemplo.' }))
    }
    setAiLoading(prev => ({ ...prev, [sectionId]: false }))
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

      {/* Progress */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Progreso del artículo</span>
          <span style={{ fontSize: 13, color: completedSections === 6 ? '#34d399' : '#a78bfa' }}>
            {completedSections}/6 secciones {completedSections === 6 ? '✅ Completo' : ''}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
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
