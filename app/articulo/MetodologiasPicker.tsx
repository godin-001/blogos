'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { METODOLOGIAS, CATEGORIAS, type Metodologia } from './metodologias'

interface Props {
  selectedId: string | null
  onSelect: (m: Metodologia) => void
}

export default function MetodologiasPicker({ selectedId, onSelect }: Props) {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('todas')
  const [difFiltro, setDifFiltro] = useState<string>('todas')
  const [detalle, setDetalle]   = useState<string | null>(null)

  const filtradas = useMemo(() => {
    return METODOLOGIAS.filter(m => {
      const matchQuery = !query || m.nombre.toLowerCase().includes(query.toLowerCase()) ||
        m.descripcion.toLowerCase().includes(query.toLowerCase()) ||
        m.mejorPara.toLowerCase().includes(query.toLowerCase())
      const matchCat = catFiltro === 'todas' || m.categoria === catFiltro
      const matchDif = difFiltro === 'todas' || m.nivelDificultad === difFiltro
      return matchQuery && matchCat && matchDif
    })
  }, [query, catFiltro, difFiltro])

  const seleccionada = METODOLOGIAS.find(m => m.id === selectedId)

  return (
    <div style={{ marginBottom: 20 }}>

      {/* Header / Toggle */}
      <button
        className="card"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: selectedId ? '1.5px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
          background: selectedId ? 'rgba(124,58,237,0.04)' : 'var(--bg-card)',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📐</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {seleccionada ? `${seleccionada.emoji} ${seleccionada.nombre}` : '50 Metodologías de Blog'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {seleccionada
                ? seleccionada.mejorPara
                : 'Elige una estructura para tu artículo — de PAS a El Manifiesto'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedId && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(124,58,237,0.12)', color: '#7c3aed',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>Aplicada ✓</span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </button>

      {/* Panel expandido */}
      {open && (
        <div className="card" style={{ marginTop: 8, padding: 20, borderRadius: 12 }}>

          {/* Buscador + Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                placeholder="Buscar metodología..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              />
            </div>

            <select
              value={catFiltro}
              onChange={e => setCatFiltro(e.target.value)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 8, padding: '0 12px', fontSize: 12, color: 'var(--text)',
                cursor: 'pointer', height: 36,
              }}
            >
              <option value="todas">Todas las categorías</option>
              {Object.entries(CATEGORIAS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            <select
              value={difFiltro}
              onChange={e => setDifFiltro(e.target.value)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 8, padding: '0 12px', fontSize: 12, color: 'var(--text)',
                cursor: 'pointer', height: 36,
              }}
            >
              <option value="todas">Todos los niveles</option>
              <option value="básico">🟢 Básico</option>
              <option value="intermedio">🟡 Intermedio</option>
              <option value="avanzado">🔴 Avanzado</option>
            </select>
          </div>

          {/* Contador */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {filtradas.length} metodología{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
          </div>

          {/* Grid de metodologías */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
            maxHeight: 480,
            overflowY: 'auto',
            paddingRight: 4,
          }}>
            {filtradas.map(m => {
              const cat   = CATEGORIAS[m.categoria]
              const isSelected = selectedId === m.id
              const isDetalle  = detalle === m.id

              return (
                <div
                  key={m.id}
                  style={{
                    border: isSelected ? `1.5px solid ${cat.color}` : '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    background: isSelected ? `${cat.color}08` : 'var(--bg-base)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Cabecera de la card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{m.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>{m.nombre}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 6px',
                          borderRadius: 20, marginTop: 3, display: 'inline-block',
                          background: `${cat.color}15`, color: cat.color,
                          border: `1px solid ${cat.color}30`,
                        }}>{cat.label}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, flexShrink: 0,
                      padding: '2px 6px', borderRadius: 6,
                      background: m.nivelDificultad === 'básico' ? 'rgba(16,185,129,0.1)' :
                                  m.nivelDificultad === 'intermedio' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: m.nivelDificultad === 'básico' ? '#059669' :
                             m.nivelDificultad === 'intermedio' ? '#d97706' : '#dc2626',
                    }}>
                      {m.nivelDificultad === 'básico' ? '🟢' : m.nivelDificultad === 'intermedio' ? '🟡' : '🔴'} {m.nivelDificultad}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                    {m.descripcion}
                  </p>

                  {/* Detalle expandible */}
                  {isDetalle && (
                    <div style={{
                      marginBottom: 10, padding: '10px 12px',
                      background: 'rgba(124,58,237,0.04)', borderRadius: 8,
                      border: '1px solid rgba(124,58,237,0.12)',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>ESTRUCTURA</div>
                      {m.estructura.map((paso, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, padding: '2px 0' }}>
                          {paso}
                        </div>
                      ))}
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        <strong>Ejemplo:</strong> {m.ejemplo}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <strong>Mejor para:</strong> {m.mejorPara}
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setDetalle(isDetalle ? null : m.id) }}
                      style={{
                        flex: 1, fontSize: 11, padding: '5px 8px', borderRadius: 6,
                        border: '1px solid var(--border-light)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: 'pointer',
                      }}
                    >
                      {isDetalle ? 'Ocultar' : 'Ver estructura'}
                    </button>
                    <button
                      onClick={() => { onSelect(m); setOpen(false) }}
                      style={{
                        flex: 1, fontSize: 11, padding: '5px 8px', borderRadius: 6,
                        border: `1px solid ${cat.color}`,
                        background: isSelected ? cat.color : 'transparent',
                        color: isSelected ? 'white' : cat.color,
                        cursor: 'pointer', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      {isSelected ? <><Check size={11} /> Aplicada</> : 'Usar esta'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filtradas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No se encontraron metodologías con esos filtros
            </div>
          )}
        </div>
      )}

      {/* Vista previa de estructura cuando hay una seleccionada */}
      {seleccionada && !open && (
        <div style={{
          marginTop: 8, padding: '12px 16px',
          background: 'rgba(124,58,237,0.04)', borderRadius: 10,
          border: '1px solid rgba(124,58,237,0.15)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
            ESTRUCTURA: {seleccionada.nombre}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {seleccionada.estructura.map((paso, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(124,58,237,0.08)', color: '#7c3aed',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
                {paso.length > 45 ? paso.slice(0, 45) + '…' : paso}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
