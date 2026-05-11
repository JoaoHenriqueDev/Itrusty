import { FastifyInstance } from 'fastify'
import { autenticar } from '../../compartilhado/middlewares/autenticar'
import { autorizar } from '../../compartilhado/middlewares/autorizar'
import {
  getPerfil,
  patchPerfil,
  patchPushToken,
  postVeiculo,
  deleteVeiculo,
} from './usuario.controller'

export async function usuarioRotas(app: FastifyInstance) {
  // Editar perfil pessoal — qualquer usuário autenticado
  app.get('/perfil', { preHandler: [autenticar] }, getPerfil)

  app.patch(
    '/perfil',
    {
      preHandler: [autenticar],
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email', maxLength: 255 },
            phone: { type: 'string', minLength: 10, maxLength: 15 },
          },
        },
      },
    },
    patchPerfil
  )

  // Push token — qualquer usuário autenticado
  app.patch(
    '/push-token',
    {
      preHandler: [autenticar],
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', minLength: 20, maxLength: 200 },
          },
        },
      },
    },
    patchPushToken
  )

  // Veículos — apenas motorista
  app.post(
    '/veiculos',
    {
      preHandler: [autenticar, autorizar('MOTORISTA')],
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['marca', 'modelo', 'ano', 'placa'],
          properties: {
            marca: { type: 'string', minLength: 1, maxLength: 50 },
            modelo: { type: 'string', minLength: 1, maxLength: 50 },
            ano: { type: 'number', minimum: 1950, maximum: 2030 },
            placa: { type: 'string', minLength: 7, maxLength: 8 },
          },
        },
      },
    },
    postVeiculo
  )

  app.delete('/veiculos/:id', { preHandler: [autenticar, autorizar('MOTORISTA')] }, deleteVeiculo)
}
