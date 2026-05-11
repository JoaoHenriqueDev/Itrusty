import { FastifyRequest, FastifyReply } from 'fastify'
import {
  onboardingMotorista,
  buscarOficinas,
  criarAgendamento,
  buscarDetalheOficina,
  listarAgendamentosMotorista,
  buscarVeiculosMotorista,
} from './motorista.service'
import { OnboardingMotoristaDTO, CriarAgendamentoDTO } from './motorista.dto'
import { gerarTokens } from '../../compartilhado/tokens'
import { extrairUserId } from '../../compartilhado/middlewares/extrairUserId'


export async function onboarding(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id = extrairUserId(req)
    const body = req.body as OnboardingMotoristaDTO
    const motorista = await onboardingMotorista(id, body)
    const tokens = await gerarTokens(req.server, id, 'MOTORISTA')
    return reply.status(201).send({
      motorista,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
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
    const { lat, lng, page } = req.query as { lat?: number; lng?: number; page?: number }
    const oficinas = await buscarOficinas(lat, lng, page ?? 1)
    return reply.send({ oficinas })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}
export async function getDetalheOficina(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    return reply.send(await buscarDetalheOficina(id))
  } catch (err: any) {
    if (err.message === 'OFICINA_NAO_ENCONTRADA') return reply.status(404).send({ error: 'Oficina não encontrada' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function getAgendamentos(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ agendamentos: await listarAgendamentosMotorista(extrairUserId(req)) })
  } catch (err: any) {
    if (err.message === 'PERFIL_NAO_ENCONTRADO') return reply.status(400).send({ error: 'Perfil não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function getVeiculos(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ veiculos: await buscarVeiculosMotorista(extrairUserId(req)) })
  } catch (err: any) {
    if (err.message === 'PERFIL_NAO_ENCONTRADO') return reply.status(400).send({ error: 'Perfil não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function postAgendamento(req: FastifyRequest, reply:
  FastifyReply) {
    try {
      const id = extrairUserId(req)
      const agendamento = await criarAgendamento(id, req.body as CriarAgendamentoDTO)
      return reply.status(201).send({ agendamento })
    } catch (err: any) {
      if (err.message === 'PERFIL_NAO_ENCONTRADO')  return reply.status(400).send({ error: 'Perfil de motorista não encontrado' })
      if (err.message === 'VEICULO_NAO_ENCONTRADO') return reply.status(400).send({ error: 'Veículo não encontrado' })
      if (err.message === 'SERVICO_NAO_ENCONTRADO') return reply.status(400).send({ error: 'Serviço não encontrado ou inativo' })
      if (err.message === 'OFICINA_NAO_ENCONTRADA') return reply.status(400).send({ error: 'Oficina não encontrada' })
      if (err.message === 'DATA_NO_PASSADO')        return reply.status(400).send({ error: 'Data do agendamento não pode ser no passado' })
      if (err.message === 'HORARIO_INDISPONIVEL')   return reply.status(409).send({ error: 'Horário indisponível para este serviço' })
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }
