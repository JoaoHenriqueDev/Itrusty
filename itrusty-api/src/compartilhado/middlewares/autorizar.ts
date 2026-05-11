import { FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '@prisma/client'

export function autorizar(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { role } = req.user as { id: string; role: Role | null }
    if (!role || !roles.includes(role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
  }
}
