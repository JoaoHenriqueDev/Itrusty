import { FastifyInstance } from 'fastify'
import { cadastrar, login, loginSocial, refresh, logout } from './auth.controller'
import { autenticar } from '../../compartilhado/middlewares/autenticar'

export async function authRotas(app: FastifyInstance) {
  app.post(
    '/cadastro',
    {
      config: { rateLimit: { max: 5, timeWindow: '1m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email', maxLength: 255 },
            phone: { type: 'string', minLength: 10, maxLength: 15 },
            password: { type: 'string', minLength: 8, maxLength: 128 },
          },
        },
      },
    },
    cadastrar
  )

  app.post(
    '/login',
    {
      config: { rateLimit: { max: 5, timeWindow: '1m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', maxLength: 255 },
            password: { type: 'string', minLength: 8, maxLength: 128 },
          },
        },
      },
    },
    login
  )

  app.post(
    '/social',
    {
      config: { rateLimit: { max: 10, timeWindow: '1m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['supabaseToken'],
          properties: {
            supabaseToken: { type: 'string', minLength: 10, maxLength: 2048 },
          },
        },
      },
    },
    loginSocial
  )

  app.post(
    '/refresh',
    {
      config: { rateLimit: { max: 10, timeWindow: '1m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', minLength: 36, maxLength: 36 },
          },
        },
      },
    },
    refresh
  )

  app.post(
    '/logout',
    {
      preHandler: [autenticar],
      config: { rateLimit: { max: 10, timeWindow: '1m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', minLength: 36, maxLength: 36 },
          },
        },
      },
    },
    logout
  )
}
