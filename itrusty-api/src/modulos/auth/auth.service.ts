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
      passwordHash
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
 export async function loginOuCadastrarSocial(supabaseToken: string) {
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(supabaseToken)
    if (error || !sbUser?.email) throw new Error('TOKEN_INVALIDO')

    const provider = sbUser.app_metadata?.provider ?? 'oauth'
    const email = sbUser.email.toLowerCase().trim()
    let user = await prisma.user.findUnique({ where: { email } })
    const isNewUser = !user

    if (!user) {
      const rawName = sbUser.user_metadata?.full_name ?? email.split('@')[0]
      const name = rawName.trim().slice(0, 100)
      user = await prisma.user.create({
       data: { name, email, provider } 
      })
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role, isNewUser }
  }




