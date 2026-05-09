 import { FastifyRequest, FastifyReply } from 'fastify'
  import { onboardingOficina } from './oficina.service'
  import { OnboardingOficinaDTO } from './oficina.dto'

   export async function onboarding(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.user as { id: string }
      const body = req.body as OnboardingOficinaDTO
      const oficina = await onboardingOficina(id, body)
      return reply.status(201).send({ oficina })
    } catch (err: any) {
        if (err.code === 'P2002') {
            return reply.status(400).send({ error: 'Perfil já criado' })
        }
      if (err.message === 'PERFIL_JA_CRIADO') {
        return reply.status(400).send({ error: 'Perfil de oficina já criado' })
      }
         if (err.message === 'ROLE_JA_DEFINIDO') {
            return reply.status(400).send({ error: 'Perfil já configurado' })
      }
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }