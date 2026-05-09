import 'dotenv/config'
import app from './app'

app.listen({ port: Number(process.env.PORT) || 3000 }, (err) => {
  if (err) { console.error(err); process.exit(1) }
})