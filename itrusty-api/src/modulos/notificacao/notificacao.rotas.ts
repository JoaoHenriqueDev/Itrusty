import { FastifyInstance } from 'fastify'
import { listar, marcarLida } from './notificacao.controller'
import { autenticar } from '../../compartilhado/middlewares/autenticar'

export async function notificacaoRotas(app: FastifyInstance) {
  app.get('/', { preHandler: [autenticar] }, listar)
  app.patch('/:id/lida', { preHandler: [autenticar] }, marcarLida)
}
