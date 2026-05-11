  import Fastify = require('fastify')
  import fastifyJwt = require('@fastify/jwt')
  import fastifyCors = require('@fastify/cors')
  import fastifyHelmet = require('@fastify/helmet')
  import fastifyRateLimit = require('@fastify/rate-limit')
  import { authRotas } from './modulos/auth/auth.rotas'
import { motoristaRotas } from './modulos/usuario/motorista.rotas'
import { usuarioRotas } from './modulos/usuario/usuario.rotas'
import { oficinaRotas } from './modulos/oficina/oficina.rotas'
import { notificacaoRotas } from './modulos/notificacao/notificacao.rotas'

const app = Fastify({
  logger: {
    level:  process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    redact: {
      paths:  ['req.body.password', 'req.body.supabaseToken', 'req.body.token', 'req.body.refreshToken'],
      remove: true,
    },
  },
})

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8081')
  .split(',')
  .map(s => s.trim())

app.register(fastifyCors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS não permitido'), false)
  },
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
})
  app.register(fastifyRateLimit, { global: true, max: 100, timeWindow: 60000 })
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não definido')
if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL não definida')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida')
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
  sign:   { iss: 'itrusty-api', aud: 'itrusty-app' },
  verify: {
    allowedIss:  ['itrusty-api'],
    allowedAud:  'itrusty-app',
    algorithms:  ['HS256'],
  },
})
  app.register(fastifyHelmet)

app.register(authRotas,        { prefix: '/auth' })
app.register(usuarioRotas,     { prefix: '/usuario' })
app.register(motoristaRotas,   { prefix: '/motorista' })
app.register(oficinaRotas,     { prefix: '/oficina' })
app.register(notificacaoRotas, { prefix: '/notificacoes' })

app.get('/health', async () => ({ status: 'ok' }))

  export default app