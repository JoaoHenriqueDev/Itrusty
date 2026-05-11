import { FastifyRequest, FastifyReply } from 'fastify'
import { extrairUserId } from '../../compartilhado/middlewares/extrairUserId'
import {
  buscarPerfilUsuario,
  atualizarPerfilUsuario,
  atualizarPushToken,
  adicionarVeiculo,
  removerVeiculo,
} from './usuario.service'
import { AtualizarUsuarioDTO, AdicionarVeiculoDTO } from './motorista.dto'

export async function patchPushToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { token } = req.body as { token: string }
    if (!token?.startsWith('ExponentPushToken')) {
      return reply.status(400).send({ error: 'Token inválido' })
    }
    await atualizarPushToken(extrairUserId(req), token)
    return reply.send({ ok: true })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function getPerfil(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await buscarPerfilUsuario(extrairUserId(req)))
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function patchPerfil(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await atualizarPerfilUsuario(extrairUserId(req), req.body as AtualizarUsuarioDTO)
    return reply.send({ user })
  } catch (err: any) {
    if (err.message === 'EMAIL_JA_CADASTRADO') return reply.status(400).send({ error: 'E-mail já cadastrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function postVeiculo(req: FastifyRequest, reply: FastifyReply) {
  try {
    const veiculo = await adicionarVeiculo(extrairUserId(req), req.body as AdicionarVeiculoDTO)
    return reply.status(201).send({ veiculo })
  } catch (err: any) {
    if (err.message === 'PERFIL_NAO_ENCONTRADO') return reply.status(400).send({ error: 'Perfil não encontrado' })
    if (err.message === 'PLACA_JA_CADASTRADA')   return reply.status(400).send({ error: 'Placa já cadastrada' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function deleteVeiculo(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    await removerVeiculo(extrairUserId(req), id)
    return reply.status(204).send()
  } catch (err: any) {
    if (err.message === 'ULTIMO_VEICULO')       return reply.status(400).send({ error: 'Você precisa ter ao menos um veículo cadastrado' })
    if (err.message === 'VEICULO_NAO_ENCONTRADO') return reply.status(404).send({ error: 'Veículo não encontrado' })
    return reply.status(500).send({ error: 'Erro interno' })
  }
}
