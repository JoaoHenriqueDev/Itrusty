import { FastifyRequest } from 'fastify'

export function extrairUserId(req: FastifyRequest): string {
  const user = req.user as { id?: string }
  if (!user?.id) throw new Error('PAYLOAD_JWT_INVALIDO')
  return user.id
}
