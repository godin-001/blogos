'use client'

import { useState } from 'react'
import { Search, Loader2, ImageIcon, Sparkles } from 'lucide-react'
import { getStoredKeys } from '@/lib/api'

type Photo = {
  id: string
  url_regular: string
  url_small: string
  thumb: string
  author: string
  author_url: string
}

export default function UnsplashPicker({
  onSelect,
  defaultQuery,
}: {
  onSelect: (url: string, author?: string) => void
  defaultQuery?: string
}) {
  const [query, setQuery] = useState(defaultQuery || '')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [tab, setTab] = useState<'search' | 'generate'>('search')
  const [dalleLoading, setDalleLoading] = useState(false)
  const [dalleUrl, setDalleUrl] = useState('')
  const [dalleError, setDalleError] = useState('')

  const searchPhotos = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const keys = getStoredKeys()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (keys.unsplash) headers['x-unsplash-key'] = keys.unsplash

      const res = await fetch('/api/unsplash', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch {
      setPhotos([])
    }
    setLoading(false)
  }

  const generateWithDalle = async () => {
    if (!query.trim()) return
    setDalleLoading(true)
    setDalleError('')
    try {
      const keys = getStoredKeys()
      if (!keys.openai) {
        setDalleError('Necesitas configurar tu API key de OpenAI')
        setDalleLoading(false)
        return
      }
      const res = await fetch('/api/dalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-key': keys.openai,
        },
        body: JSON.stringify({ titulo: query, niche: '' }),
      })
      const data = await res.json()
      if (data.url) {
        setDalleUrl(data.url)
      } else {
        setDalleError(data.error || 'Error al generar imagen')
      }
    } catch {
      setDalleError('Error al generar imagen')
    }
    setDalleLoading(false)
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg-base)', padding: 3, borderRadius: 8, width: 'fit-content' }}>
        <button onClick={() => setTab('search')} style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          background: tab === 'search' ? 'var(--bg-card-hover)' : 'transparent',
          color: tab === 'search' ? 'var(--text)' : 'var(--text-muted)',
        }}>🖼️ Buscar foto</button>
        <button onClick={() => setTab('generate')} style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          background: tab === 'generate' ? 'var(--bg-card-hover)' : 'transparent',
          color: tab === 'generate' ? 'var(--text)' : 'var(--text-muted)',
        }}>🎨 Generar con IA</button>
      </div>

      {tab === 'search' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Buscar imágenes (ej: technology, marketing)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPhotos()}
                style={{ paddingLeft: 32, fontSize: 13 }}
              />
            </div>
            <button className="btn btn-primary" onClick={searchPhotos} disabled={loading}
              style={{ fontSize: 12, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              Buscar
            </button>
          </div>

          {photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => {
                    setSelected(photo)
                    onSelect(photo.url_regular, photo.author)
                  }}
                  style={{
                    position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: selected?.id === photo.id ? '2px solid #7c3aed' : '2px solid transparent',
                    aspectRatio: '16/10',
                  }}
                >
                  <img src={photo.thumb} alt={`Foto por ${photo.author}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '4px 6px', background: 'rgba(0,0,0,0.7)',
                    fontSize: 9, color: '#ccc',
                  }}>
                    📷 {photo.author}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <ImageIcon size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: 12 }}>Busca imágenes de portada en Unsplash</p>
              </div>
            )
          )}

          {selected && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✓ Foto por <a href={selected.author_url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>{selected.author}</a> en Unsplash
            </div>
          )}
        </>
      )}

      {tab === 'generate' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="Título del artículo para generar portada..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button className="btn btn-primary" onClick={generateWithDalle} disabled={dalleLoading}
              style={{ fontSize: 12, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {dalleLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {dalleLoading ? 'Generando...' : 'Generar'}
            </button>
          </div>

          {dalleLoading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 12 }}>Generando imagen con DALL-E 3... (puede tardar ~15s)</p>
            </div>
          )}

          {dalleUrl && !dalleLoading && (
            <div>
              <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                <img src={dalleUrl} alt="Portada generada con IA"
                  style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <button className="btn btn-primary" onClick={() => onSelect(dalleUrl)}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                ✓ Usar esta imagen como portada
              </button>
            </div>
          )}

          {dalleError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 12 }}>
              ⚠️ {dalleError}
            </div>
          )}

          {!dalleUrl && !dalleLoading && !dalleError && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <Sparkles size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>Genera una portada única con DALL-E 3</p>
              <p style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Requiere API key de OpenAI</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
