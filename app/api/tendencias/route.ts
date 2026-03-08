import { NextRequest, NextResponse } from 'next/server'
import { mockTrends } from '@/lib/mock-ai'

export async function POST(req: NextRequest) {
  try {
    const { niche, language = 'es' } = await req.json()

    const newsKey =
      req.headers.get('x-news-key') ||
      process.env.NEWS_API_KEY ||
      ''

    if (!newsKey) {
      return NextResponse.json({ ...mockTrends(niche), demo: true })
    }

    const query = niche
      ? `${niche} blog marketing emprendimiento`
      : 'emprendimiento marketing digital inteligencia artificial'

    const url = new URL('https://newsapi.org/v2/everything')
    url.searchParams.set('q', query)
    url.searchParams.set('language', language)
    url.searchParams.set('sortBy', 'publishedAt')
    url.searchParams.set('pageSize', '12')
    url.searchParams.set('apiKey', newsKey)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== 'ok') {
      return NextResponse.json({ ...mockTrends(niche), demo: true })
    }

    const articulos = data.articles
      .filter((a: { title: string; description: string }) =>
        a.title && a.description && !a.title.includes('[Removed]')
      )
      .slice(0, 10)
      .map((a: { title: string; description: string; url: string; source: { name: string }; publishedAt: string; urlToImage: string }) => ({
        titulo: a.title,
        descripcion: a.description,
        url: a.url,
        fuente: a.source?.name || 'Fuente',
        fecha: new Date(a.publishedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        imagen: a.urlToImage,
      }))

    const ideas_sugeridas = articulos.slice(0, 5).map((a: { titulo: string }) => ({
      titulo: `Mi perspectiva sobre: ${a.titulo.substring(0, 60)}`,
      fuente_noticia: a.titulo,
    }))

    return NextResponse.json({ articulos, ideas_sugeridas, total: data.totalResults, fuente: 'newsapi' })

  } catch {
    return NextResponse.json({ ...mockTrends(''), demo: true })
  }
}
