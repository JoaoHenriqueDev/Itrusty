import { FastifyRequest, FastifyReply } from 'fastify'
import {
  solicitarRedefinicaoSenha,
  redefinirSenha,
  verificarEmail,
  reenviarVerificacao,
} from './conta.service'
import { EsqueciSenhaDTO, RedefinirSenhaDTO, VerificarEmailDTO } from './conta.dto'
import { extrairUserId } from '../../compartilhado/middlewares/extrairUserId'

export async function esqueciSenha(
  req: FastifyRequest<{ Body: EsqueciSenhaDTO }>,
  reply: FastifyReply
) {
  try {
    await solicitarRedefinicaoSenha(req.body.email)
    // Resposta idêntica independente de o email existir (anti-enumeração)
    return reply.send({
      message: 'Se este email estiver cadastrado, você receberá as instruções em breve.',
    })
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function resetSenha(
  req: FastifyRequest<{ Body: RedefinirSenhaDTO }>,
  reply: FastifyReply
) {
  try {
    await redefinirSenha(req.body.token, req.body.password)
    return reply.send({ message: 'Senha redefinida com sucesso. Faça login novamente.' })
  } catch (err: any) {
    if (err.message === 'TOKEN_INVALIDO') {
      return reply.status(400).send({ error: 'Link inválido ou expirado. Solicite um novo.' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function confirmarEmail(
  req: FastifyRequest<{ Body: VerificarEmailDTO }>,
  reply: FastifyReply
) {
  try {
    await verificarEmail(req.body.token)
    return reply.send({ message: 'Email verificado com sucesso!' })
  } catch (err: any) {
    if (err.message === 'TOKEN_INVALIDO') {
      return reply.status(400).send({ error: 'Link inválido ou expirado. Solicite um novo no aplicativo.' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function reenviarConfirmacao(req: FastifyRequest, reply: FastifyReply) {
  try {
    await reenviarVerificacao(extrairUserId(req))
    return reply.send({ message: 'Email de verificação reenviado.' })
  } catch (err: any) {
    if (err.message === 'EMAIL_JA_VERIFICADO') {
      return reply.status(400).send({ error: 'Este email já foi verificado.' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}
