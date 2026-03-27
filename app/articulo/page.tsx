'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Check, Copy, Download, Save, ChevronDown, ChevronUp, Loader2, AlertCircle, Zap, RefreshCw, X } from 'lucide-react'
import { callChat } from '@/lib/api'

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

type TituloVariante = { titulo: string; tipo: string; porque: string }
type HookVariante = { tipo: string; texto: string }

const TIPO_BADGE_COLORS: Record<string, string> = {
  numeros: '#3b82f6', pregunta: '#8b5cf6', contraste: '#f59e0b', promesa: '#10b981',
  curiosidad: '#6366f1', urgencia: '#ef4444', historia: '#ec4899', beneficio: '#06b6d4',
  tendencias: '#f97316', historia_hook: '#ec4899', estadistica: '#3b82f6',
  dolor: '#ef4444', controversia: '#f59e0b',
}

export default function ArticuloPage() {
  const [content, setContent] = useState<Record<string, string>>({
    titulo: '', gancho: '', subtitulos: '', ejemplos: '', reflexion: '', cta: '',
  })
  const [activeSection, setActiveSection] = useState(0)
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [aiError, setAiError] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<Record<string, string> | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  // Panel IA Avanzada
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [titulosLoading, setTitulosLoading] = useState(false)
  const [hooksLoading, setHooksLoading] = useState(false)
  const [generateAllLoading, setGenerateAllLoading] = useState(false)
  const [titulosVariantes, setTitulosVariantes] = useState<TituloVariante[]>([])
  const [hooksVariantes, setHooksVariantes] = useState<HookVariante[]>([])
  const [aiPanelTab, setAiPanelTab] = useState<'titulos' | 'hooks' | null>(null)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const idea = params.get('idea') || ''
      if (idea) {
        setContent(prev => ({ ...prev, titulo: decodeURIComponent(idea) }))
      }
    } catch {}

    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))

    // Revisar borrador guardado
    const draft = localStorage.getItem('blogos_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const savedAt = new Date(parsed.savedAt).getTime()
        const now = Date.now()
        const hours24 = 24 * 60 * 60 * 1000
        if (now - savedAt < hours24 && parsed.content) {
          setHasDraft(true)
        }
      } catch {}
    }
  }, [])

  // Auto-save cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.values(content).some(v => v.trim())) {
        localStorage.setItem('blogos_draft', JSON.stringify({
          content,
          savedAt: new Date().toISOString(),
        }))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [content])

  const restoreDraft = () => {
    try {
      const draft = localStorage.getItem('blogos_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        setContent(parsed.content)
        setHasDraft(false)
        setGlobalMsg('📝 Borrador restaurado')
        setTimeout(() => setGlobalMsg(''), 3000)
      }
    } catch {}
  }

  const discardDraft = () => {
    localStorage.removeItem('blogos_draft')
    setHasDraft(false)
  }

  // Contador de palabras + tiempo de lectura
  const wordCount = Object.values(content)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length

  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const completedSections = SECTIONS.filter(s => content[s.id]?.trim().length > 0).length
  const progress = (completedSections / SECTIONS.length) * 100

  const generateWithAI = useCallback(async (sectionId: string) => {
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
    }
    setAiLoading(prev => ({ ...prev, [sectionId]: false }))
  }, [content, profile])

  // IA Avanzada: 10 variaciones de título
  const generateTitulos = async () => {
    setTitulosLoading(true)
    setAiPanelTab('titulos')
    try {
      const tema = content.titulo || profile?.niche || 'emprendimiento y negocios'
      const data = await callChat({
        mode: 'titulos',
        profile,
        messages: [{ role: 'user', content: tema }],
      })
      if (data?.text) {
        const jsonMatch = data.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          setTitulosVariantes(JSON.parse(jsonMatch[0]))
        }
      }
    } catch {
      // Fallback mock
      setTitulosVariantes([
        { titulo: `7 estrategias probadas para dominar ${profile?.niche || 'tu nicho'}`, tipo: 'numeros', porque: 'Los números generan expectativa concreta' },
        { titulo: `¿Por qué fracasan en ${profile?.niche || 'tu industria'}? La respuesta te sorprenderá`, tipo: 'pregunta', porque: 'La pregunta activa curiosidad inmediata' },
        { titulo: `Lo que nadie te cuenta sobre ${profile?.niche || 'el éxito online'}`, tipo: 'contraste', porque: 'El secreto implícito activa el FOMO' },
        { titulo: `Cómo lograr resultados en ${profile?.niche || 'tu negocio'} sin los errores típicos`, tipo: 'promesa', porque: 'Beneficio directo + elimina objeción' },
        { titulo: `El método que cambió todo para 1,000+ emprendedores en ${profile?.niche || 'negocios'}`, tipo: 'historia', porque: 'Prueba social masiva genera credibilidad' },
      ])
    }
    setTitulosLoading(false)
  }

  // IA Avanzada: 5 ganchos alternativos
  const generateHooks = async () => {
    setHooksLoading(true)
    setAiPanelTab('hooks')
    try {
      const tema = content.titulo || profile?.niche || 'emprendimiento'
      const data = await callChat({
        mode: 'hooks',
        profile,
        messages: [{ role: 'user', content: tema }],
      })
      if (data?.text) {
        const jsonMatch = data.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          setHooksVariantes(JSON.parse(jsonMatch[0]))
        }
      }
    } catch {
      setHooksVariantes([
        { tipo: 'historia', texto: 'Hace 3 años, estaba exactamente donde tú estás ahora. Sin resultados, sin claridad, sin un sistema. Hoy te cuento qué cambió todo.' },
        { tipo: 'estadistica', texto: 'El 87% de los blogs que empiezan este año estarán abandonados en 6 meses. No por falta de talento — por falta de sistema.' },
        { tipo: 'pregunta', texto: '¿Qué pasaría si pudieras eliminar el 80% del esfuerzo y obtener el doble de resultados? No es promesa vacía — es lo que aprenderás aquí.' },
        { tipo: 'dolor', texto: 'Publicar sin resultados duele. Dedicar horas a contenido que nadie lee es frustrante. Pero el problema no eres tú — es el enfoque.' },
        { tipo: 'controversia', texto: 'El consejo estándar sobre blogs está desactualizado. Lo que todos enseñan te está frenando. Aquí está la verdad.' },
      ])
    }
    setHooksLoading(false)
  }

  // IA Avanzada: Generar todo en secuencia
  const generateAll = async () => {
    setGenerateAllLoading(true)
    for (const section of SECTIONS) {
      await generateWithAI(section.id)
      await new Promise(r => setTimeout(r, 400))
    }
    setGenerateAllLoading(false)
    setGlobalMsg('✅ Artículo completo generado con IA')
    setTimeout(() => setGlobalMsg(''), 4000)
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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>✍️ Nuevo Artículo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Metodología BlogOS — 6 secciones para un artículo de alto nivel
        </p>
      </div>

      {/* Banner borrador */}
      {hasDraft && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>
            📝 Tienes un borrador guardado automáticamente
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={restoreDraft}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: '1px solid #6366f1', background: 'rgba(99,102,241,0.15)', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
            >Restaurar</button>
            <button
              onClick={discardDraft}
              style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
            ><X size={14} /></button>
          </div>
        </div>
      )}

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
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Progreso del artículo</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {wordCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                📝 {wordCount} palabras · ⏱️ {readingTime} min
              </span>
            )}
            <span style={{ fontSize: 13, color: completedSections === 6 ? '#34d399' : '#6366f1' }}>
              {completedSections}/6 {completedSections === 6 ? '✅ Completo' : ''}
            </span>
          </div>
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

      {/* ── PANEL IA AVANZADA ── */}
      <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          style={{
            width: '100%', padding: '14px 20px', background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'left' }}>✨ IA Avanzada</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'left' }}>
                Títulos, ganchos y generación completa con IA
              </div>
            </div>
          </div>
          {showAIPanel ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </button>

        {showAIPanel && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-light)' }}>
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={generateTitulos}
                disabled={titulosLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                {titulosLoading ? <Loader2 size={14} className="animate-spin" /> : '🎯'}
                {titulosLoading ? 'Generando...' : '10 Títulos'}
              </button>
              <button
                className="btn-secondary"
                onClick={generateHooks}
                disabled={hooksLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                {hooksLoading ? <Loader2 size={14} className="animate-spin" /> : '🪝'}
                {hooksLoading ? 'Generando...' : '5 Ganchos'}
              </button>
              <button
                className="btn-primary"
                onClick={generateAll}
                disabled={generateAllLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                {generateAllLoading
                  ? <><RefreshCw size={14} className="animate-spin" /> Generando todo...</>
                  : <><Sparkles size={14} /> Generar Todo</>
                }
              </button>
            </div>

            {/* Resultados: Títulos */}
            {aiPanelTab === 'titulos' && titulosVariantes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selecciona un título
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {titulosVariantes.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setContent(prev => ({ ...prev, titulo: t.titulo }))
                        setGlobalMsg(`✅ Título "${t.titulo.slice(0, 40)}..." aplicado`)
                        setTimeout(() => setGlobalMsg(''), 3000)
                      }}
                      style={{
                        textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                        background: 'var(--bg-base)', border: '1px solid var(--border-light)',
                        cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginTop: 2,
                          background: `${TIPO_BADGE_COLORS[t.tipo] || '#6366f1'}20`,
                          color: TIPO_BADGE_COLORS[t.tipo] || '#6366f1',
                          border: `1px solid ${TIPO_BADGE_COLORS[t.tipo] || '#6366f1'}40`,
                          fontWeight: 700,
                        }}>
                          {t.tipo}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 3 }}>
                            {t.titulo}
                          </div>
                          {t.porque && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>💡 {t.porque}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados: Ganchos */}
            {aiPanelTab === 'hooks' && hooksVariantes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selecciona un gancho
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {hooksVariantes.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setContent(prev => ({ ...prev, gancho: h.texto }))
                        setGlobalMsg('✅ Gancho aplicado al artículo')
                        setTimeout(() => setGlobalMsg(''), 3000)
                      }}
                      style={{
                        textAlign: 'left', padding: '12px 14px', borderRadius: 8,
                        background: 'var(--bg-base)', border: '1px solid var(--border-light)',
                        cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginTop: 2,
                          background: `${TIPO_BADGE_COLORS[h.tipo] || '#6366f1'}20`,
                          color: TIPO_BADGE_COLORS[h.tipo] || '#6366f1',
                          border: `1px solid ${TIPO_BADGE_COLORS[h.tipo] || '#6366f1'}40`,
                          fontWeight: 700,
                        }}>
                          {h.tipo}
                        </span>
                        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                          {h.texto}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
            {content.titulo || '(Sin título)'}
          </h2>
          {content.gancho && (
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12, fontSize: 14, borderLeft: '3px solid #6366f1', paddingLeft: 12 }}>
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
            <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, color: '#6366f1', fontSize: 13, fontWeight: 600 }}>
              🚀 {content.cta}
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map((section, index) => (
          <div key={section.id} className="card" style={{
            border: activeSection === index ? '1px solid #6366f1' : '1px solid var(--border)',
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
                  onChange={e => setContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                  style={{ minHeight: section.id === 'subtitulos' || section.id === 'ejemplos' ? 160 : 120 }}
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
                    {content[section.id]?.split(/\s+/).filter(w => w).length || 0} palabras
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
