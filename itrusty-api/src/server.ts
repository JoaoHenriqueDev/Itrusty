import 'dotenv/config'
import app from './app'
import { agendarLimpeza } from './compartilhado/limpeza'

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  const pararLimpeza = agendarLimpeza()

  const shutdown = async (signal: string) => {
    app.log.info(`Recebeu ${signal} — encerrando servidor`)
    pararLimpeza()
    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
})
