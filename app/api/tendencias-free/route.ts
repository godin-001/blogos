import { NextRequest, NextResponse } from 'next/server'

// Google Trends RSS por país (sin clave)
async function getGoogleTrends(country = 'MX') {
  try {
    const res = await fetch(
      `https://trends.google.com/trending/rss?geo=${country}`,
      { headers: { 'User-Agent': 'BlogOS/1.0' }, next: { revalidate: 3600 } }
    )
    const xml = await res.text()
    const matches = xml.match(/<title>(.*?)<\/title>/g) || []
    return matches
      .slice(1, 11)
      .map(t => t.replace(/<\/?title>/g, '').trim())
      .filter(t => t.length > 2)
  } catch {
    return []
  }
}

// HackerNews API (sin clave) — historias top
async function getHackerNews(query: string) {
  try {
    const term = encodeURIComponent(query || 'content marketing blog')
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${term}&tags=story&hitsPerPage=6`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    return (data.hits || []).map((h: { title?: string; url?: string; points?: number }) => ({
      title: h.title || '',
      url: h.url || '',
      puntos: h.points || 0,
    }))
  } catch {
    return []
  }
}

// Wikipedia resumen (sin clave)
async function getWikiSummary(topic: string, lang = 'es') {
  try {
    const slug = encodeURIComponent(topic.replace(/ /g, '_'))
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      titulo: data.title,
      extracto: data.extract?.slice(0, 400) || '',
      url: data.content_urls?.desktop?.page || '',
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche = 'marketing', query = 'marketing digital' } = body

    // Ejecutar todas en paralelo
    const [trends, hn, wiki] = await Promise.all([
      getGoogleTrends('MX'),
      getHackerNews(query),
      getWikiSummary(niche),
    ])

    return NextResponse.json({
      fuente: 'multi-free',
      google_trends: trends,
      hacker_news: hn,
      wikipedia: wiki,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: String(e), fuente: 'error', google_trends: [], hacker_news: [], wikipedia: null },
      { status: 500 }
    )
  }
}
