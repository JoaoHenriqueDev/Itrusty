import { FastifyRequest, FastifyReply } from 'fastify'
import { listarNaoLidas, marcarComoLida } from './notificacao.service'
import { extrairUserId } from '../../compartilhado/middlewares/extrairUserId'

export async function listar(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ notificacoes: await listarNaoLidas(extrairUserId(req)) })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function marcarLida(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await marcarComoLida(id, extrairUserId(req))
    return reply.send({ ok: true })
  } catch {
    return reply.status(404).send({ error: 'Notificação não encontrada' })
  }
}
