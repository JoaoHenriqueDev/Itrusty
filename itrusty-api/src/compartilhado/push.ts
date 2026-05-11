type MensagemPush = {
  to:    string
  title: string
  body:  string
  data?: Record<string, unknown>
}

export async function enviarPush(msg: MensagemPush): Promise<void> {
  if (!msg.to.startsWith('ExponentPushToken')) return

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to:    msg.to,
        sound: 'default',
        title: msg.title,
        body:  msg.body,
        data:  msg.data ?? {},
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // falha silenciosa — push é best-effort
  }
}
