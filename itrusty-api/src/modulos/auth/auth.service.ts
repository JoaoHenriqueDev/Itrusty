import bcrypt from 'bcryptjs'
import { prisma } from '../../compartilhado/prisma'
import { Role } from '@prisma/client'
import { CadastroDTO, LoginDTO, UsuarioResponseDTO } from './auth.dto'
import { supabase } from '../../compartilhado/supabase'

export async function cadastrarUsuario(data: CadastroDTO) {
    const email = data.email.toLowerCase().trim()
    const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) throw new Error('EMAIL_JA_CADASTRADO')

  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: email,
      phone: data.phone,
      passwordHash,
      role: data.role,
    },
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  } as UsuarioResponseDTO
}

export async function loginUsuario(data: LoginDTO) {
 const email = data.email.toLowerCase().trim()
  const existe = await prisma.user.findUnique({ where: { email } })
  if (!existe || !existe.passwordHash) throw new Error('CREDENCIAIS_INVALIDAS')

  const senhaCorreta = await bcrypt.compare(data.password, existe.passwordHash)
  if (!senhaCorreta) throw new Error('CREDENCIAIS_INVALIDAS')

  return {
    id: existe.id,
    name: existe.name,
    email: existe.email,
    phone: existe.phone,
    role: existe.role
  } as UsuarioResponseDTO
}
export async function loginOuCadastrarSocial(supabaseToken: string, role: Role) {
    // 1. Valida o token com o Supabase
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(supabaseToken)
    if (error || !sbUser?.email) throw new Error('TOKEN_INVALIDO')

  const provider = sbUser.app_metadata?.provider ?? 'oauth'

    // 2. Busca ou cria o usuário no seu banco
  const email = sbUser.email.toLowerCase().trim()
  let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
  const rawName = sbUser.user_metadata?.full_name ?? sbUser.email.split('@')[0]
  const name = rawName.trim().slice(0, 100)
      user = await prisma.user.create({
        data: { name, email: email, role, provider },
      })
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role }
  }



