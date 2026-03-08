import { NextRequest, NextResponse } from 'next/server'
import { mockSerperData } from '@/lib/mock-ai'

export async function POST(req: NextRequest) {
  try {
    const { keyword, niche } = await req.json()
    const query = keyword || niche || 'blog marketing digital'

    const serperKey =
      req.headers.get('x-serper-key') ||
      process.env.SERPER_API_KEY ||
      ''

    if (!serperKey) {
      return NextResponse.json({ ...mockSerperData(query), demo: true })
    }

    const [searchRes, newsRes] = await Promise.all([
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'mx', hl: 'es', num: 10 }),
      }),
      fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'mx', hl: 'es', num: 5 }),
      }),
    ])

    const [searchData, newsData] = await Promise.all([searchRes.json(), newsRes.json()])

    const results = (searchData.organic || []).slice(0, 8).map((r: { title: string; link: string; snippet: string; position: number }) => ({
      titulo: r.title, url: r.link, snippet: r.snippet, posicion: r.position,
    }))

    const noticias = (newsData.news || []).slice(0, 5).map((n: { title: string; link: string; snippet: string; source: string; date: string }) => ({
      titulo: n.title, url: n.link, snippet: n.snippet, fuente: n.source, fecha: n.date,
    }))

    const bigSites = results.filter((r: { url: string }) =>
      ['wikipedia', 'forbes', 'entrepreneur', 'hubspot', 'nytimes', 'bbc'].some(s => r.url.includes(s))
    ).length
    const dificultad = bigSites >= 5 ? 'Alta' : bigSites >= 3 ? 'Media' : 'Baja'

    const allText = results.map((r: { snippet: string }) => r.snippet).join(' ')
    const words = allText.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4)
    const freq: Record<string, number> = {}
    words.forEach((w: string) => { freq[w] = (freq[w] || 0) + 1 })
    const keywords_relacionadas = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w)
      .filter(w => !['para', 'como', 'este', 'esta', 'that', 'with', 'your'].includes(w))

    return NextResponse.json({
      keyword: query, dificultad, top_resultados: results, noticias_recientes: noticias,
      keywords_relacionadas, total_resultados: searchData.searchInformation?.totalResults || '—',
      fuente: 'serper',
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: msg, ...mockSerperData('') }, { status: 200 })
  }
}
