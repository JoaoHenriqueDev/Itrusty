import { FastifyInstance } from 'fastify'
import { esqueciSenha, resetSenha, confirmarEmail, reenviarConfirmacao } from './conta.controller'
import { autenticar } from '../../compartilhado/middlewares/autenticar'

export async function contaRotas(app: FastifyInstance) {
  // Solicitar link de redefinição de senha — público, rate limit restrito
  app.post(
    '/esqueci-senha',
    {
      config: { rateLimit: { max: 3, timeWindow: '15m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', maxLength: 255 },
          },
        },
      },
    },
    esqueciSenha
  )

  // Redefinir senha com token — público
  app.post(
    '/redefinir-senha',
    {
      config: { rateLimit: { max: 5, timeWindow: '15m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string', minLength: 64, maxLength: 64 },
            password: { type: 'string', minLength: 8, maxLength: 128 },
          },
        },
      },
    },
    resetSenha
  )

  // Verificar email via token — público (vindo do deep link)
  app.post(
    '/verificar-email',
    {
      config: { rateLimit: { max: 10, timeWindow: '15m' } },
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', minLength: 64, maxLength: 64 },
          },
        },
      },
    },
    confirmarEmail
  )

  // Reenviar email de verificação — requer auth, rate limit por usuário
  app.post(
    '/reenviar-verificacao',
    {
      preHandler: [autenticar],
      config: { rateLimit: { max: 3, timeWindow: '1h' } },
    },
    reenviarConfirmacao
  )
}
