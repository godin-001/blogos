'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type EntryStatus = 'idea' | 'borrador' | 'revision' | 'publicado'

type CalEntry = {
  id: string
  date: string // YYYY-MM-DD
  title: string
  status: EntryStatus
  tipo?: string
}

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string; emoji: string }> = {
  idea: { label: 'Idea', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', emoji: '💡' },
  borrador: { label: 'Borrador', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', emoji: '✍️' },
  revision: { label: 'En revisión', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', emoji: '🔍' },
  publicado: { label: 'Publicado', color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '✅' },
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function CalendarioPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [entries, setEntries] = useState<CalEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: '', status: 'idea' as EntryStatus })
  const [pipeline, setPipeline] = useState<'calendar' | 'pipeline'>('calendar')

  useEffect(() => {
    const saved = localStorage.getItem('blogos_calendar')
    if (saved) setEntries(JSON.parse(saved))
  }, [])

  const save = (updated: CalEntry[]) => {
    setEntries(updated)
    localStorage.setItem('blogos_calendar', JSON.stringify(updated))
  }

  const addEntry = () => {
    if (!newEntry.title.trim() || !selectedDate) return
    const entry: CalEntry = {
      id: `cal-${Date.now()}`,
      date: selectedDate,
      title: newEntry.title,
      status: newEntry.status,
    }
    save([...entries, entry])
    setNewEntry({ title: '', status: 'idea' })
    setShowForm(false)
  }

  const updateStatus = (id: string, status: EntryStatus) => {
    save(entries.map(e => e.id === id ? { ...e, status } : e))
  }

  const deleteEntry = (id: string) => {
    save(entries.filter(e => e.id !== id))
  }

  // Calendar generation
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const getDateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  const getEntriesForDate = (dateStr: string) => entries.filter(e => e.date === dateStr)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const publishedCount = entries.filter(e => e.status === 'publicado').length
  const thisMonthEntries = entries.filter(e => e.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>📅 Calendario Editorial</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Planifica tu contenido. Consistencia = crecimiento.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} className="card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{cfg.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, margin: '4px 0' }}>
              {entries.filter(e => e.status === status as EntryStatus).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { id: 'calendar', label: '📅 Calendario' },
          { id: 'pipeline', label: '⚡ Pipeline' },
        ].map(t => (
          <button key={t.id} onClick={() => setPipeline(t.id as 'calendar' | 'pipeline')} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', transition: 'all 0.2s',
            background: pipeline === t.id ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'transparent',
            color: pipeline === t.id ? 'white' : 'var(--text-muted)',
          }}>{t.label}</button>
        ))}
      </div>

      {pipeline === 'calendar' ? (
        <>
          {/* Calendar header */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
                <ChevronLeft size={20} />
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {MONTHS[currentMonth]} {currentYear}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                  {thisMonthEntries.length} artículos
                </span>
              </div>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
              {DAYS.map(d => (
                <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: 70, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = getDateStr(day)
                const dayEntries = getEntriesForDate(dateStr)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate

                return (
                  <div
                    key={day}
                    onClick={() => { setSelectedDate(dateStr); setShowForm(false) }}
                    style={{
                      minHeight: 70, padding: '6px',
                      borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: isSelected ? 'rgba(124,58,237,0.1)' : 'transparent',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', marginBottom: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent',
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'white' : 'var(--text-muted)',
                    }}>
                      {day}
                    </div>
                    {dayEntries.slice(0, 2).map(e => (
                      <div key={e.id} style={{
                        fontSize: 9, padding: '1px 5px', borderRadius: 3, marginBottom: 2,
                        background: STATUS_CONFIG[e.status].bg,
                        color: STATUS_CONFIG[e.status].color,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {STATUS_CONFIG[e.status].emoji} {e.title}
                      </div>
                    ))}
                    {dayEntries.length > 2 && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{dayEntries.length - 2} más</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected date panel */}
          {selectedDate && (
            <div className="card animate-fade-in" style={{ padding: '20px', marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    <Calendar size={15} style={{ display: 'inline', marginRight: 8 }} />
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowForm(!showForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </div>

              {showForm && (
                <div style={{ marginBottom: 16, padding: '14px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <input
                    className="input-field"
                    placeholder="Título del artículo..."
                    value={newEntry.title}
                    onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addEntry()}
                    style={{ marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {(Object.entries(STATUS_CONFIG) as [EntryStatus, typeof STATUS_CONFIG[EntryStatus]][]).map(([s, cfg]) => (
                      <button key={s} onClick={() => setNewEntry(p => ({ ...p, status: s }))} style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        border: newEntry.status === s ? `1px solid ${cfg.color}` : '1px solid var(--border-light)',
                        background: newEntry.status === s ? cfg.bg : 'transparent',
                        color: newEntry.status === s ? cfg.color : 'var(--text-muted)',
                      }}>
                        {cfg.emoji} {cfg.label}
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={addEntry} disabled={!newEntry.title.trim()} style={{ fontSize: 13 }}>
                    <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Agregar al calendario
                  </button>
                </div>
              )}

              {getEntriesForDate(selectedDate).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
                  Sin artículos para este día. ¡Agrega uno! 📝
                </div>
              ) : (
                getEntriesForDate(selectedDate).map(entry => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-light)', marginBottom: 8
                  }}>
                    <span style={{ fontSize: 18 }}>{STATUS_CONFIG[entry.status].emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{entry.title}</span>
                    <select
                      value={entry.status}
                      onChange={e => updateStatus(entry.id, e.target.value as EntryStatus)}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '4px 8px', color: STATUS_CONFIG[entry.status].color, fontSize: 12 }}
                    >
                      {(Object.entries(STATUS_CONFIG) as [EntryStatus, typeof STATUS_CONFIG[EntryStatus]][]).map(([s, cfg]) => (
                        <option key={s} value={s}>{cfg.emoji} {cfg.label}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        /* Pipeline view */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {(Object.entries(STATUS_CONFIG) as [EntryStatus, typeof STATUS_CONFIG[EntryStatus]][]).map(([status, cfg]) => (
            <div key={status}>
              <div style={{ padding: '10px', background: cfg.bg, borderRadius: '10px 10px 0 0', border: `1px solid ${cfg.color}30`, borderBottom: 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.emoji} {cfg.label}</div>
                <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>{entries.filter(e => e.status === status).length} artículos</div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${cfg.color}30`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px', minHeight: 200 }}>
                {entries.filter(e => e.status === status).map(entry => (
                  <div key={entry.id} style={{
                    padding: '10px', background: 'var(--bg-base)', borderRadius: 8,
                    border: '1px solid var(--border)', marginBottom: 8
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>{entry.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                      {status !== 'publicado' && (
                        <button
                          onClick={() => {
                            const statuses: EntryStatus[] = ['idea', 'borrador', 'revision', 'publicado']
                            const next = statuses[statuses.indexOf(status) + 1]
                            if (next) updateStatus(entry.id, next)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, fontSize: 11 }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {entries.filter(e => e.status === status).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                    Sin artículos aquí
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly goal reminder */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>🎯 Tu meta editorial</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Publica <strong style={{ color: 'var(--text)' }}>2-3 artículos por semana</strong> para mantener la consistencia y crecer tu audiencia.
          En total tienes <strong style={{ color: '#34d399' }}>{publishedCount} artículo{publishedCount !== 1 ? 's' : ''} publicado{publishedCount !== 1 ? 's' : ''}</strong>.
        </div>
      </div>
    </div>
  )
}
