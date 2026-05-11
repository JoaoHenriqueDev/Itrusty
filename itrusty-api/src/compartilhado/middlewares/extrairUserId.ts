import { FastifyRequest } from 'fastify'

export function extrairUserId(req: FastifyRequest): string {
  return (req.user as { id: string }).id
}
