import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { keyword, gl, hl } = await req.json()
  const key = req.headers.get('x-serpapi-key') || ''

  if (!key) {
    // Fallback: datos mock
    return NextResponse.json({
      organic: [
        { title: `Guía completa: ${keyword || 'marketing digital'}`, link: 'https://example.com/1', snippet: 'Descubre las mejores estrategias para dominar tu nicho...', position: 1 },
        { title: `${keyword || 'Marketing'}: tendencias 2026`, link: 'https://example.com/2', snippet: 'Las tendencias más importantes que debes conocer este año...', position: 2 },
        { title: `Cómo empezar con ${keyword || 'tu blog'}`, link: 'https://example.com/3', snippet: 'Paso a paso para principiantes que quieren resultados rápidos...', position: 3 },
        { title: `Top 10 herramientas de ${keyword || 'content marketing'}`, link: 'https://example.com/4', snippet: 'Las herramientas que usan los profesionales del sector...', position: 4 },
        { title: `Errores comunes en ${keyword || 'blogging'}`, link: 'https://example.com/5', snippet: 'Evita estos errores que cometen el 90% de los principiantes...', position: 5 },
      ],
      related: [`${keyword} para principiantes`, `${keyword} avanzado`, `mejores herramientas ${keyword}`, `${keyword} gratis`],
      paa: [`¿Qué es ${keyword}?`, `¿Cómo funciona ${keyword}?`, `¿Cuánto cuesta ${keyword}?`, `¿Vale la pena ${keyword}?`],
      demo: true,
    })
  }

  try {
    const params = new URLSearchParams({
      q: keyword,
      gl: gl || 'mx',
      hl: hl || 'es',
      num: '10',
      api_key: key,
    })

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`SerpApi ${res.status}`)
    const data = await res.json()

    const organic = (data.organic_results || []).slice(0, 10).map((r: Record<string, unknown>, i: number) => ({
      title: r.title || '',
      link: r.link || '',
      snippet: r.snippet || '',
      position: (r.position as number) || i + 1,
    }))

    const related = (data.related_searches || []).map((r: Record<string, string>) => r.query).filter(Boolean)
    const paa = (data.related_questions || []).map((r: Record<string, string>) => r.question).filter(Boolean)

    return NextResponse.json({ organic, related, paa })
  } catch (e) {
    console.error('[BlogOS] SerpApi error:', e)
    return NextResponse.json({ organic: [], related: [], paa: [], error: String(e) })
  }
}
