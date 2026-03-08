'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, RefreshCw, Download, HelpCircle } from 'lucide-react'
import { callChat } from '@/lib/api'

const STATIC_QUESTIONS = [
  { categoria: 'Contexto', pregunta: '¿Para quién escribes este artículo exactamente? Descríbeme a tu lector ideal con detalles.' },
  { categoria: 'Profundidad', pregunta: '¿Cuál es el insight que SOLO tú puedes dar sobre este tema? ¿Qué perspectiva única tienes?' },
  { categoria: 'Contraste', pregunta: '¿Qué cree la mayoría de personas sobre este tema que está completamente equivocado?' },
  { categoria: 'Experiencia', pregunta: '¿Tienes una historia personal, un error o un momento de descubrimiento que ilustre este punto perfectamente?' },
  { categoria: 'Impacto', pregunta: '¿Qué cambia en la vida del lector después de leer tu artículo? ¿Qué piensa, siente o hace diferente?' },
  { categoria: 'Contrarian', pregunta: '¿Cuál es la opinión más polémica pero honesta que tienes sobre este tema?' },
  { categoria: 'Simplicidad', pregunta: 'Si tuvieras que explicarle el núcleo de este artículo a un niño de 10 años en 3 frases, ¿cómo lo harías?' },
  { categoria: 'Relevancia', pregunta: '¿Por qué este tema importa AHORA? ¿Qué está pasando en el mundo que hace que este artículo sea urgente?' },
  { categoria: 'Diferenciación', pregunta: '¿Cómo es diferente tu artículo de los 10 primeros resultados de Google sobre este tema?' },
  { categoria: 'Credibilidad', pregunta: '¿Qué te da autoridad para escribir sobre esto? ¿Qué has vivido, aprendido o demostrado?' },
]

type Message = {
  role: 'user' | 'assistant'
  content: string
  categoria?: string
}

export default function PreguntasPage() {
  const [topic, setTopic] = useState('')
  const [topicSet, setTopicSet] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'ai' | 'curated'>('curated')
  const [qIndex, setQIndex] = useState(0)
  const [profile, setProfile] = useState<Record<string, string> | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const p = localStorage.getItem('blogos_profile')
    if (p) setProfile(JSON.parse(p))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startSession = () => {
    if (!topic.trim()) return
    setTopicSet(true)
    const firstQ = mode === 'curated'
      ? STATIC_QUESTIONS[0]
      : null

    if (mode === 'ai') {
      sendAI([{
        role: 'user',
        content: `Quiero hacer una sesión reflexiva para escribir un artículo sobre: "${topic}". 
Hazme la primera pregunta reflexiva para ayudarme a pensar más profundo sobre este tema.`
      }])
    } else {
      setMessages([{
        role: 'assistant',
        content: firstQ!.pregunta,
        categoria: firstQ!.categoria,
      }])
    }
  }

  const sendAI = async (msgs: Message[]) => {
    setLoading(true)
    try {
      const data = await callChat({
        mode: 'reflexion',
        profile,
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
      })
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
      } else if (data.needsKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Para usar la IA adaptativa, agrega tu API key de Anthropic en Configuración → APIs. Por ahora continúo con preguntas curadas.' }])
        setMode('curated')
      }
    } catch {
      // Fall back to curated
      const q = STATIC_QUESTIONS[Math.floor(Math.random() * STATIC_QUESTIONS.length)]
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: q.pregunta,
        categoria: q.categoria
      }])
    }
    setLoading(false)
  }

  const sendResponse = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    const newInsight = input
    setInput('')
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInsights(prev => [...prev, newInsight])

    if (mode === 'ai') {
      await sendAI(updated)
    } else {
      const nextIndex = qIndex + 1
      if (nextIndex < STATIC_QUESTIONS.length) {
        setQIndex(nextIndex)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: STATIC_QUESTIONS[nextIndex].pregunta,
            categoria: STATIC_QUESTIONS[nextIndex].categoria,
          }])
        }, 500)
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `¡Excelente sesión! 🎉 Has reflexionado sobre ${insights.length + 1} aspectos clave de tu artículo. 
            
Tus respuestas son el corazón de tu artículo. Ahora ve a la sección "Nuevo Artículo" y usa estas ideas para escribir cada sección con profundidad y autenticidad.

¿Quieres explorar alguna pregunta más o ya tienes suficiente material para escribir?`,
          }])
        }, 500)
      }
    }
  }

  const downloadInsights = () => {
    const text = `# Sesión Reflexiva: ${topic}\n\n` +
      messages
        .map(m => `**${m.role === 'assistant' ? '🤔 Pregunta' : '💬 Tu respuesta'}:**\n${m.content}`)
        .join('\n\n') +
      `\n\n---\n*Generado por BlogOS*`
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reflexion-${topic.slice(0, 20)}.md`
    a.click()
  }

  const reset = () => {
    setTopicSet(false)
    setTopic('')
    setMessages([])
    setInput('')
    setQIndex(0)
    setInsights([])
  }

  const CATEGORIA_COLORS: Record<string, string> = {
    Contexto: '#06b6d4',
    Profundidad: '#7c3aed',
    Contraste: '#f59e0b',
    Experiencia: '#10b981',
    Impacto: '#ef4444',
    Contrarian: '#f43f5e',
    Simplicidad: '#06b6d4',
    Relevancia: '#f59e0b',
    Diferenciación: '#7c3aed',
    Credibilidad: '#10b981',
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>🧠 Sesión Reflexiva</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Preguntas que hacen pensar. El artículo que escribas después de esto será diferente.
        </p>
      </div>

      {!topicSet ? (
        /* Setup */
        <div className="card" style={{ padding: '28px', maxWidth: 560 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            ¿Sobre qué vas a escribir?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Define el tema y elige cómo quieres explorar tus ideas
          </p>

          <input
            className="input-field"
            placeholder="Ej: Cómo superar el miedo al fracaso como emprendedor..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startSession()}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setMode('curated')}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                border: mode === 'curated' ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                background: mode === 'curated' ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                color: mode === 'curated' ? '#a78bfa' : 'var(--text-muted)',
                transition: 'all 0.2s', textAlign: 'center'
              }}
            >
              <HelpCircle size={18} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Preguntas curadas</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>10 preguntas poderosas</div>
            </button>
            <button
              onClick={() => setMode('ai')}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                border: mode === 'ai' ? '1px solid #7c3aed' : '1px solid var(--border-light)',
                background: mode === 'ai' ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
                color: mode === 'ai' ? '#a78bfa' : 'var(--text-muted)',
                transition: 'all 0.2s', textAlign: 'center'
              }}
            >
              <Sparkles size={18} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>IA adaptativa</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>Preguntas personalizadas</div>
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={startSession}
            disabled={!topic.trim()}
            style={{ width: '100%', opacity: topic.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Sparkles size={16} />
            Comenzar sesión reflexiva
          </button>

          {/* Static questions preview */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>
              Ejemplos de preguntas:
            </div>
            {STATIC_QUESTIONS.slice(0, 4).map((q, i) => (
              <div key={i} style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0,
                  background: `${CATEGORIA_COLORS[q.categoria]}20`,
                  color: CATEGORIA_COLORS[q.categoria],
                  border: `1px solid ${CATEGORIA_COLORS[q.categoria]}40`,
                  fontWeight: 600
                }}>{q.categoria}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{q.pregunta}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Chat session */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Topic bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, marginBottom: 16
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>TEMA: </span>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{topic}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {insights.length > 0 && (
                <button className="btn-secondary" onClick={downloadInsights} style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Download size={13} /> Guardar
                </button>
              )}
              <button className="btn-secondary" onClick={reset} style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <RefreshCw size={13} /> Nueva
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '14px 16px', borderRadius: 12,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'var(--bg-card)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)',
                }}>
                  {msg.role === 'assistant' && msg.categoria && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, marginBottom: 8, padding: '2px 6px',
                      background: `${CATEGORIA_COLORS[msg.categoria] || '#7c3aed'}20`,
                      color: CATEGORIA_COLORS[msg.categoria] || '#7c3aed',
                      display: 'inline-block', borderRadius: 4
                    }}>
                      {msg.categoria}
                    </div>
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && mode === 'curated' && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      Pregunta {Math.min(qIndex + 1, 10)} de 10
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '10px 14px' }}>
                <div className="animate-pulse-slow" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                <div className="animate-pulse-slow" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animationDelay: '0.2s' }} />
                <div className="animate-pulse-slow" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <textarea
              className="textarea-field"
              placeholder="Escribe tu respuesta aquí... Sé honesto y específico"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendResponse()
                }
              }}
              style={{ minHeight: 80, maxHeight: 140 }}
            />
            <button
              className="btn-primary"
              onClick={sendResponse}
              disabled={!input.trim() || loading}
              style={{ alignSelf: 'flex-end', padding: '12px 16px', opacity: input.trim() && !loading ? 1 : 0.5 }}
            >
              <Send size={18} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Enter para enviar • Shift + Enter para nueva línea
          </div>
        </div>
      )}
    </div>
  )
}
