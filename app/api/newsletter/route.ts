import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, subject, content, fromName } = await req.json()
  const key = req.headers.get('x-resend-key') || ''

  if (!key) {
    return NextResponse.json({ error: 'Se requiere API key de Resend' }, { status: 400 })
  }

  if (!to || !subject || !content) {
    return NextResponse.json({ error: 'Faltan campos requeridos: to, subject, content' }, { status: 400 })
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">BlogOS</span>
    </div>
    <div style="background:#0f0f1a;border:1px solid #1a1a2e;border-radius:12px;padding:32px 24px;">
      <h1 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 16px;">${subject}</h1>
      <div style="color:#94a3b8;font-size:15px;line-height:1.8;">
        ${content.split('\n').map((p: string) => `<p style="margin:0 0 12px;">${p}</p>`).join('')}
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;color:#475569;font-size:12px;">
      <p>Enviado con <a href="#" style="color:#7c3aed;text-decoration:none;">BlogOS</a></p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: `${fromName || 'BlogOS'} <onboarding@resend.dev>`,
        to: [to],
        subject,
        html: htmlContent,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as Record<string, string>).message || `Resend ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json({ id: data.id })
  } catch (e) {
    console.error('[BlogOS] Resend error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
