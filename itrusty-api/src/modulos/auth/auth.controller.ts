import { FastifyRequest, FastifyReply } from 'fastify'
import { cadastrarUsuario, loginUsuario, loginOuCadastrarSocial } from './auth.service'
import { CadastroDTO, LoginDTO, SocialLoginDTO } from './auth.dto'

 export async function cadastrar(req: FastifyRequest<{ Body: CadastroDTO }>, reply: FastifyReply) {
    try {
      const user = await cadastrarUsuario(req.body)
      const token = req.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' })
      return reply.status(201).send({
        token,
        user: { id: user.id, name: user.name, role: user.role },
        requiresOnboarding: true  
      })
    } catch (err: any) {
      if (err.message === 'EMAIL_JA_CADASTRADO') {
        return reply.status(400).send({ error: 'E-mail já cadastrado' })
      }
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }

export async function login(req: FastifyRequest<{ Body: LoginDTO }>, reply: FastifyReply) {
    try {
      const user = await loginUsuario(req.body)
      const token = req.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' })
      return reply.send({
        token,
        user: { id: user.id, name: user.name, role: user.role },
        requiresOnboarding: !user.role  // true se não tiver role ainda
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
      const token = req.server.jwt.sign({ id: result.id, role: result.role }, { expiresIn: '15m' })
      return reply.send({
        token,
        user: { id: result.id, name: result.name, role: result.role },
        requiresOnboarding: !result.role
      })
    } catch (err: any) {
      if (err.message === 'TOKEN_INVALIDO') {
        return reply.status(401).send({ error: 'Token inválido' })
      }
      return reply.status(500).send({ error: 'Erro interno' })
    }
  }