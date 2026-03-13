import { NextRequest, NextResponse } from 'next/server'

// Pollinations.ai — generación de imágenes GRATIS, sin API key
// Docs: https://pollinations.ai
// Límite: uso razonable, sin autenticación requerida

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1200, height = 630, model = 'flux' } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt requerido' }, { status: 400 })
    }

    // Mejorar el prompt para imágenes de blog
    const enhancedPrompt = `${prompt}, professional blog cover image, modern design, high quality, 4k, clean aesthetic`

    // Pollinations.ai — URL directa de imagen
    const encodedPrompt = encodeURIComponent(enhancedPrompt)
    const seed = Math.floor(Math.random() * 999999)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`

    // Verificar que la URL responde (HEAD request)
    const check = await fetch(imageUrl, { method: 'HEAD' })
    if (!check.ok) {
      throw new Error(`Pollinations respondió con ${check.status}`)
    }

    return NextResponse.json({
      url: imageUrl,
      prompt: enhancedPrompt,
      model,
      width,
      height,
      seed,
      provider: 'pollinations.ai',
    })
  } catch (err) {
    console.error('imagen-ia error:', err)
    return NextResponse.json(
      { error: 'Error generando imagen. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}

// GET — generación rápida desde query params
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const prompt = searchParams.get('prompt') || 'abstract blog cover'
  const width = parseInt(searchParams.get('width') || '1200')
  const height = parseInt(searchParams.get('height') || '630')
  const seed = Math.floor(Math.random() * 999999)

  const encodedPrompt = encodeURIComponent(
    `${prompt}, professional blog cover, modern, clean, high quality`
  )

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`

  return NextResponse.json({ url: imageUrl, seed })
}
