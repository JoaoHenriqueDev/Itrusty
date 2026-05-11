import { FastifyRequest, FastifyReply } from 'fastify'
import {
  onboardingOficina,
  buscarPerfil,
  atualizarPerfil,
  homeDashboard,
  agendaPorData,
  detalheAgendamento,
  aceitarAgendamento,
  recusarAgendamento,
  finalizarAgendamento,
  listarServicos,
  criarServico,
  atualizarServico,
  excluirServico,
} from './oficina.service'
import { OnboardingOficinaDTO, CriarServicoDTO, AtualizarServicoDTO, AtualizarPerfilDTO } from './oficina.dto'
import { gerarTokens } from '../../compartilhado/tokens'
import { extrairUserId } from '../../compartilhado/middlewares/extrairUserId'

// ─── onboarding ──────────────────────────────────────────────────────────────

export async function onboarding(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id      = extrairUserId(req)
    const body    = req.body as OnboardingOficinaDTO
    const oficina = await onboardingOficina(id, body)
    const tokens  = await gerarTokens(req.server, id, 'OFICINA')
    return reply.status(201).send({ oficina, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  } catch (err: any) {
    if (err.code === 'P2002')               return reply.status(400).send({ error: 'CNPJ já cadastrado' })
    if (err.message === 'PERFIL_JA_CRIADO') return reply.status(400).send({ error: 'Perfil de oficina já criado' })
    if (err.message === 'ROLE_JA_DEFINIDO') return reply.status(400).send({ error: 'Perfil já configurado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

// ─── perfil ──────────────────────────────────────────────────────────────────

export async function getPerfil(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await buscarPerfil(extrairUserId(req)))
  } catch (err: any) {
    if (err.message === 'OFICINA_NAO_ENCONTRADA') return reply.status(404).send({ error: 'Oficina não encontrada' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function patchPerfil(req: FastifyRequest, reply: FastifyReply) {
  try {
    await atualizarPerfil(extrairUserId(req), req.body as AtualizarPerfilDTO)
    return reply.send({ ok: true })
  } catch (err: any) {
    if (err.message === 'OFICINA_NAO_ENCONTRADA') return reply.status(404).send({ error: 'Oficina não encontrada' })
    if (err.message === 'FOTO_URL_INVALIDA')      return reply.status(400).send({ error: 'URL da foto inválida' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export async function home(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await homeDashboard(extrairUserId(req)))
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

// ─── agenda ──────────────────────────────────────────────────────────────────

export async function agenda(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { data }  = req.query as { data?: string }
    const dataFiltro = data ? new Date(data) : new Date(new Date().toISOString().split('T')[0])
    return reply.send({ agendamentos: await agendaPorData(extrairUserId(req), dataFiltro) })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function detalhe(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    return reply.send(await detalheAgendamento(extrairUserId(req), id))
  } catch (err: any) {
    if (err.message === 'AGENDAMENTO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Agendamento não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function aceitar(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await aceitarAgendamento(extrairUserId(req), id)
    return reply.send({ ok: true })
  } catch (err: any) {
    if (err.message === 'AGENDAMENTO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Agendamento não encontrado' })
    if (err.message === 'STATUS_INVALIDO')            return reply.status(400).send({ error: 'Status inválido para esta ação' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function recusar(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await recusarAgendamento(extrairUserId(req), id)
    return reply.send({ ok: true })
  } catch (err: any) {
    if (err.message === 'AGENDAMENTO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Agendamento não encontrado' })
    if (err.message === 'STATUS_INVALIDO')            return reply.status(400).send({ error: 'Status inválido para esta ação' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function finalizar(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await finalizarAgendamento(extrairUserId(req), id)
    return reply.send({ ok: true })
  } catch (err: any) {
    if (err.message === 'AGENDAMENTO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Agendamento não encontrado' })
    if (err.message === 'STATUS_INVALIDO')            return reply.status(400).send({ error: 'Status inválido para esta ação' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

// ─── serviços ────────────────────────────────────────────────────────────────

export async function getServicos(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await listarServicos(extrairUserId(req)))
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function postServico(req: FastifyRequest, reply: FastifyReply) {
  try {
    const s = await criarServico(extrairUserId(req), req.body as CriarServicoDTO)
    return reply.status(201).send({ servico: s })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function patchServico(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const s = await atualizarServico(extrairUserId(req), id, req.body as AtualizarServicoDTO)
    return reply.send({ servico: s })
  } catch (err: any) {
    if (err.message === 'SERVICO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Serviço não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function deleteServico(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await excluirServico(extrairUserId(req), id)
    return reply.status(204).send()
  } catch (err: any) {
    if (err.message === 'SERVICO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Serviço não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}
