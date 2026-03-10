import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  const key = req.headers.get('x-unsplash-key') || ''

  if (!key) {
    return NextResponse.json({ photos: [], demo: true })
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    const data = await res.json()

    const photos = (data.results || []).map((p: Record<string, unknown>) => {
      const urls = p.urls as Record<string, string>
      const user = p.user as Record<string, unknown>
      const links = p.links as Record<string, string>
      const userLinks = user.links as Record<string, string>
      return {
        id: p.id,
        url_regular: urls.regular,
        url_small: urls.small,
        thumb: urls.thumb,
        author: (user.name as string) || 'Unknown',
        author_url: userLinks?.html || '',
        download_location: links?.download_location || '',
      }
    })

    return NextResponse.json({ photos })
  } catch (e) {
    console.error('[BlogOS] Unsplash error:', e)
    return NextResponse.json({ photos: [], error: 'Error al buscar imágenes' })
  }
}
