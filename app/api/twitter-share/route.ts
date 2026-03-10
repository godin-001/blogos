import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { titulo, gancho, subtitulos, reflexion, cta } = await req.json()

  function splitIntoTweets(text: string, maxLen = 270): string[] {
    if (text.length <= maxLen) return [text]
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const tweets: string[] = []
    let current = ''
    for (const s of sentences) {
      if ((current + s).length > maxLen) {
        if (current.trim()) tweets.push(current.trim())
        current = s
      } else {
        current += s
      }
    }
    if (current.trim()) tweets.push(current.trim())
    return tweets
  }

  const tweets: string[] = []

  // Tweet 1: Título + gancho
  const tweet1 = `🧵 ${titulo}\n\n${gancho}`.slice(0, 280)
  tweets.push(tweet1)

  // Tweets intermedios: subtítulos
  if (subtitulos) {
    const lines = subtitulos.split('\n').filter((l: string) => l.trim())
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, '').trim()
      if (cleaned) {
        tweets.push(...splitIntoTweets(`💡 ${cleaned}`))
      }
    }
  }

  // Tweet de reflexión
  if (reflexion) {
    tweets.push(...splitIntoTweets(`🧠 ${reflexion}`))
  }

  // Tweet final: CTA
  if (cta) {
    tweets.push(`🚀 ${cta}\n\n♻️ Comparte este thread si te fue útil`.slice(0, 280))
  }

  // Numerar tweets
  const numbered = tweets.map((t, i) => `${i + 1}/${tweets.length} ${t}`)

  const threadUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(numbered[0])}`

  return NextResponse.json({ tweets: numbered, threadUrl })
}
