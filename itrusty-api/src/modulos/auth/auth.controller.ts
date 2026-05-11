import { FastifyRequest, FastifyReply } from 'fastify'
import { cadastrarUsuario, loginUsuario, loginOuCadastrarSocial } from './auth.service'
import { CadastroDTO, LoginDTO, SocialLoginDTO } from './auth.dto'
import { gerarTokens } from '../../compartilhado/tokens'
import { prisma } from '../../compartilhado/prisma'

export async function cadastrar(req: FastifyRequest<{ Body: CadastroDTO }>, reply: FastifyReply) {
  try {
    const user = await cadastrarUsuario(req.body)
    const tokens = await gerarTokens(req.server, user.id, user.role ?? null)
    return reply.status(201).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, name: user.name, role: user.role },
      requiresOnboarding: true,
    })
  } catch (err: any) {
    if (err.message === 'EMAIL_JA_CADASTRADO' || err.code === 'P2002') {
      return reply.status(400).send({ error: 'E-mail já cadastrado' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function login(req: FastifyRequest<{ Body: LoginDTO }>, reply: FastifyReply) {
  try {
    const user = await loginUsuario(req.body)
    const tokens = await gerarTokens(req.server, user.id, user.role ?? null)
    return reply.send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, name: user.name, role: user.role },
      requiresOnboarding: !user.role,
    })
  } catch (err: any) {
    if (err.message === 'CREDENCIAIS_INVALIDAS') {
      return reply.status(401).send({ error: 'E-mail ou senha inválidos' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function loginSocial(req: FastifyRequest<{ Body: SocialLoginDTO }>, reply: FastifyReply) {
  try {
    const result = await loginOuCadastrarSocial(req.body.supabaseToken)
    const tokens = await gerarTokens(req.server, result.id, result.role ?? null)
    return reply.send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: result.id, name: result.name, role: result.role },
      requiresOnboarding: !result.role,
    })
  } catch (err: any) {
    if (err.message === 'TOKEN_INVALIDO') {
      return reply.status(401).send({ error: 'Token inválido' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function refresh(req: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
  try {
    const { refreshToken } = req.body

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, role: true } } },
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Sessão expirada. Faça login novamente.' })
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const tokens = await gerarTokens(req.server, stored.user.id, stored.user.role ?? null)
    return reply.send(tokens)
  } catch {
    return reply.status(500).send({ error: 'Erro interno' })
  }
}
