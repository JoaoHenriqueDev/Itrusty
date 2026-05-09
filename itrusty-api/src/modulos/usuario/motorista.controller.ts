 import { FastifyRequest, FastifyReply } from 'fastify'
  import { onboardingMotorista, buscarOficinas } from './motorista.service'
  import { OnboardingMotoristaDTO } from './motorista.dto'

export async function onboarding(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.user as { id: string }
      const body = req.body as OnboardingMotoristaDTO
      const motorista = await onboardingMotorista(id, body)
      return reply.status(201).send({ motorista })
    } catch (err: any) {
         if (err.code === 'P2002') {
            return reply.status(400).send({ error: 'Perfil já criado' })
        }
      if (err.message === 'PERFIL_JA_CRIADO') {
        return reply.status(400).send({ error: 'Perfil de motorista já criado' })
      }
        if (err.message === 'ROLE_JA_DEFINIDO') {
            return reply.status(400).send({ error: 'Perfil já configurado' })
      }
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }
    export async function home(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lat, lng } = req.query as { lat?: number; lng?: number }
      const oficinas = await buscarOficinas(lat, lng)
      return reply.send({ oficinas })
    } catch {
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }