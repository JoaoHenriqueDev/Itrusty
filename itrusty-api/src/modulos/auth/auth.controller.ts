import { FastifyRequest, FastifyReply } from 'fastify'
import { cadastrarUsuario, loginUsuario, loginOuCadastrarSocial } from './auth.service'
import { CadastroDTO, LoginDTO, SocialLoginDTO, UsuarioResponseDTO } from './auth.dto'
import { Role } from '@prisma/client'

export async function cadastrar( req: FastifyRequest<{ Body: CadastroDTO }>,
    reply: FastifyReply) {
  const { name, email, phone, password, role } = req.body as {
    name: string
    email: string
    phone: string
    password: string
    role: Role
  }

  try {
    const user = await cadastrarUsuario(req.body)
    const token = req.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '7d' })
    return reply.status(201).send({ token, user: { id: user.id, name: user.name, role: user.role } })
  } catch (err: any) {
    if (err.message === 'EMAIL_JA_CADASTRADO') {
      return reply.status(400).send({ error: 'E-mail já cadastrado' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function login(req: FastifyRequest<{ Body: LoginDTO }>, reply: FastifyReply) {
  const { email, password } = req.body as { email: string; password: string }

  try {
    const user = await loginUsuario(req.body)
    const token = req.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '7d' })
    return reply.send({ token, user: { id: user.id, name: user.name, role: user.role } })
  } catch (err: any) {
    if (err.message === 'CREDENCIAIS_INVALIDAS') {
      return reply.status(401).send({ error: 'E-mail ou senha inválidos' })
    }
    return reply.status(500).send({ error: 'Erro interno' })
  }
}

export async function loginSocial(req: FastifyRequest<{ Body: SocialLoginDTO }>, reply: FastifyReply) {
    try {
      const user = await loginOuCadastrarSocial(req.body.supabaseToken, req.body.role)
      const token = req.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '7d' })
      return reply.send({ token, user: { id: user.id, name: user.name, role: user.role } })
    } catch (err: any) {
      if (err.message === 'TOKEN_INVALIDO') {
        return reply.status(401).send({ error: 'Token inválido' })
      }
      return reply.status(500).send({ error: 'Erro interno' })
    }
}