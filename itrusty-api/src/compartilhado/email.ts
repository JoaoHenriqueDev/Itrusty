const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'iTrusty <noreply@itrusty.com.br>'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function enviarEmail({ to, subject, html }: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [EMAIL DEV] Para: ${to} | Assunto: ${subject}\n`)
    }
    return
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    // fire-and-forget — falha de email não interrompe o fluxo principal
  }
}
