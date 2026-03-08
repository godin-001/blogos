'use client'

import { useState, useMemo } from 'react'
import { Search, X, Sparkles, Loader2, Copy, Check, Zap } from 'lucide-react'
import { TECHNIQUES, CATEGORIES, type Technique } from '@/lib/techniques'
import { callChat, getProfile } from '@/lib/api'

const POWER_CONFIG = {
  legendaria: { label: 'Legendaria', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  'muy alta':  { label: 'Muy Alta',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  alta:        { label: 'Alta',      color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
}

export default function TecnicasPage() {
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('todos')
  const [selected, setSelected]     = useState<Technique | null>(null)
  const [aiInput, setAiInput]       = useState('')
  const [aiResult, setAiResult]     = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [copied, setCopied]         = useState(false)

  // Filtros
  const filtered = useMemo(() => {
    let list = TECHNIQUES
    if (category !== 'todos') list = list.filter(t => t.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.bestFor.some(b => b.toLowerCase().includes(q)) ||
        t.origin.toLowerCase().includes(q)
      )
    }
    // Legendaria primero
    const order = { legendaria: 0, 'muy alta': 1, alta: 2 }
    return [...list].sort((a, b) => order[a.power] - order[b.power])
  }, [search, category])

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: TECHNIQUES.length }
    CATEGORIES.slice(1).forEach(cat => {
      c[cat.id] = TECHNIQUES.filter(t => t.category === cat.id).length
    })
    return c
  }, [])

  const generateWithAI = async () => {
    if (!selected || !aiInput.trim()) return
    setAiLoading(true)
    setAiResult('')
    const profile = getProfile()
    try {
      const prompt = `Aplica la técnica de copywriting/storytelling "${selected.name}" para crear contenido de blog.

TÉCNICA: ${selected.name}
CATEGORÍA: ${selected.category}
DESCRIPCIÓN: ${selected.description}
CÓMO APLICARLA: ${selected.howTo}

SOLICITUD DEL USUARIO: ${aiInput}

NICHO DEL BLOG: ${profile?.niche || 'marketing digital'}
AUDIENCIA: ${profile?.audience || 'emprendedores'}
ESTILO: ${profile?.style || 'profesional pero cercano'}

Instrucciones:
- Aplica la técnica "${selected.name}" de forma precisa y visible
- El resultado debe ser texto listo para usar en un blog
- Máximo 400 palabras
- En español latinoamericano
- NO expliques la técnica — simplemente aplícala
- El resultado debe ser impactante y de clase mundial`

      const res = await callChat({
        messages: [{ role: 'user', content: prompt }],
        mode: 'estructura',
        profile,
      })
      setAiResult((res as { text?: string }).text || '')
    } catch {
      setAiResult('Usando ejemplo de la técnica:\n\n' + selected.example)
    }
    setAiLoading(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(aiResult).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            📚 Técnicas de Copywriting & Storytelling
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Las <strong style={{ color: 'var(--text)' }}>{TECHNIQUES.length} mejores técnicas del mundo</strong> — desde Aristóteles hasta Pixar. Haz clic en cualquiera para aplicarla con IA.
        </p>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Legendarias', count: TECHNIQUES.filter(t => t.power === 'legendaria').length, color: '#f59e0b' },
          { label: 'Muy Alta',    count: TECHNIQUES.filter(t => t.power === 'muy alta').length,   color: '#a78bfa' },
          { label: 'Alta',        count: TECHNIQUES.filter(t => t.power === 'alta').length,        color: '#34d399' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color,
          }}>
            {s.count} {s.label}
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input"
          placeholder="Buscar técnica, categoría o aplicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${category === cat.id ? '#7c3aed' : 'var(--border)'}`,
              background: category === cat.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-base)',
              color: category === cat.id ? '#a78bfa' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.emoji} {cat.label}
            <span style={{
              marginLeft: 6, fontSize: 10,
              background: category === cat.id ? 'rgba(124,58,237,0.3)' : 'var(--border)',
              padding: '1px 5px', borderRadius: 10, color: category === cat.id ? '#a78bfa' : 'var(--text-muted)',
            }}>
              {counts[cat.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Mostrando <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> de {TECHNIQUES.length} técnicas
        {search && <> para "<strong style={{ color: '#a78bfa' }}>{search}</strong>"</>}
      </div>

      {/* Grid de técnicas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
        {filtered.map(t => {
          const pw = POWER_CONFIG[t.power]
          return (
            <div
              key={t.id}
              className="card card-hover"
              onClick={() => { setSelected(t); setAiInput(''); setAiResult('') }}
              style={{
                padding: '16px', cursor: 'pointer',
                borderTop: `2px solid ${pw.color}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.origin}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                  background: pw.bg, border: `1px solid ${pw.border}`, color: pw.color,
                }}>
                  {pw.label}
                </span>
              </div>
              <p style={{
                fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>
                {t.description}
              </p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {t.bestFor.slice(0, 2).map(b => (
                  <span key={b} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 6,
                    background: 'var(--bg-base)', border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                  }}>
                    {b}
                  </span>
                ))}
                {t.bestFor.length > 2 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 4px' }}>
                    +{t.bestFor.length - 2}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No encontramos esa técnica</div>
          <div style={{ fontSize: 13 }}>Prueba con otro término: AIDA, PAS, storytelling, titulares...</div>
        </div>
      )}

      {/* Modal de detalle */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '20px 16px', overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 680,
              border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              background: `linear-gradient(135deg, ${POWER_CONFIG[selected.power].bg}, transparent)`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 32 }}>{selected.emoji}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📌 {selected.origin}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 8,
                    background: POWER_CONFIG[selected.power].bg,
                    border: `1px solid ${POWER_CONFIG[selected.power].border}`,
                    color: POWER_CONFIG[selected.power].color,
                  }}>
                    ⚡ Poder: {POWER_CONFIG[selected.power].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Descripción */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>¿Qué es?</div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{selected.description}</p>
              </div>

              {/* Cómo aplicarla */}
              <div style={{ padding: '14px 16px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🛠️ Cómo aplicarla</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{selected.howTo}</p>
              </div>

              {/* Ejemplo */}
              <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>💡 Ejemplo real</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{selected.example}</p>
              </div>

              {/* Mejor para */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>✅ Ideal para</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.bestFor.map(b => (
                    <span key={b} style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399',
                    }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generador con IA */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Zap size={16} color="#a78bfa" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Generar con IA usando esta técnica</span>
                </div>
                <textarea
                  className="textarea"
                  placeholder={`Describe tu artículo o tema y aplicaremos "${selected.name}" automáticamente...\n\nEj: "Quiero escribir sobre cómo usar Instagram para bloggers"`}
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  style={{ minHeight: 90, marginBottom: 10 }}
                />
                <button
                  className="btn-primary"
                  onClick={generateWithAI}
                  disabled={aiLoading || !aiInput.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: aiResult ? 12 : 0 }}
                >
                  {aiLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Aplicando {selected.name}...</>
                    : <><Sparkles size={15} /> Aplicar técnica con Claude</>
                  }
                </button>

                {aiResult && (
                  <div style={{
                    padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)',
                    borderRadius: 10, position: 'relative',
                  }}>
                    <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 8 }}>
                      ✨ Resultado — técnica {selected.name} aplicada
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                      {aiResult}
                    </p>
                    <button
                      className="btn-secondary"
                      onClick={copyResult}
                      style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      {copied ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
