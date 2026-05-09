import { FastifyInstance } from 'fastify'
 import { cadastrar, login, loginSocial} from './auth.controller'

export async function authRotas(app: FastifyInstance) {
    const cadastroSchema = {
    body: {
      additionalProperties: false,
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name:     { type: 'string', minLength: 2, maxLength: 100 },
        email:    { type: 'string', format: 'email', maxLength: 255 },
        phone:    { type: 'string', minLength: 10, maxLength: 15 },
        password: { type: 'string', minLength: 8, maxLength: 128 }
      },
    },
  }
  const loginSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', format: 'email', maxLength: 255 },
        password: { type: 'string', minLength: 8, maxLength: 128 },
      },
    },
  }
  app.post('/cadastro', { 
    config: { rateLimit: { max: 5, timeWindow: '1m' } },
    schema: cadastroSchema }, cadastrar)
  app.post('/login', { 
    config: { rateLimit: { max: 5, timeWindow: '1m' } },
    schema: loginSchema }, login)
 app.post('/social', {
    config: { rateLimit: { max: 10, timeWindow: '1m' } },
    schema: {
      body: {
        type: 'object',
        required: ['supabaseToken'],
        properties: {
          supabaseToken: { type: 'string', minLength: 10, maxLength: 2048 },
        },
      },
    },
  }, loginSocial)
}