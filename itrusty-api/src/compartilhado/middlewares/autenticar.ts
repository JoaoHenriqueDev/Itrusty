import { FastifyRequest, FastifyReply } from 'fastify'

export async function autenticar(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
