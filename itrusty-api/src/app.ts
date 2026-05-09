  import Fastify = require('fastify')
  import fastifyJwt = require('@fastify/jwt')
  import fastifyCors = require('@fastify/cors')
  import fastifyHelmet = require('@fastify/helmet')
  import fastifyRateLimit = require('@fastify/rate-limit')
  import { authRotas } from './modulos/auth/auth.rotas'

const app = Fastify({ logger: true })

app.register(fastifyCors, {
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
  app.register(fastifyRateLimit, { global: true, max: 100, timeWindow: 60000 })
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não definido')
if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL não definida')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida')
app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
  app.register(fastifyHelmet)

app.register(authRotas, { prefix: '/auth' })

app.get('/health', async () => ({ status: 'ok' }))

  export default app