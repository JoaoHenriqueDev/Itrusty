  import { FastifyRequest, FastifyReply } from 'fastify'

  export async function autenticar(req: FastifyRequest, reply: FastifyReply) {
    await req.jwtVerify()
  }
