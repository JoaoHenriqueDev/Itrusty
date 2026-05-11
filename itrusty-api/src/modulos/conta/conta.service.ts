import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../compartilhado/prisma'
import { enviarEmail } from '../../compartilhado/email'
import {
  templateRedefinicaoSenha,
  templateSenhaAlterada,
  templateVerificacaoEmail,
} from '../../compartilhado/templates'

const RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hora
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 horas
const DEEP_LINK = process.env.APP_DEEP_LINK_SCHEME ?? 'itrusty'

// ─── Recuperação de senha ─────────────────────────────────────────────────────

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  const emailNorm = email.toLowerCase().trim()

  // Busca usuário — sai silenciosamente se não existir (anti-enumeração)
  const user = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, name: true, email: true, passwordHash: true },
  })

  // Não envia para contas OAuth (sem senha local)
  if (!user || !user.passwordHash) return

  // Invalida tokens anteriores não utilizados
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS)

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  })

  const link = `${DEEP_LINK}://reset-senha?token=${token}`

  // fire-and-forget — não bloqueia a resposta
  enviarEmail({
    to: user.email,
    subject: 'Redefinição de senha — iTrusty',
    html: templateRedefinicaoSenha({ nome: user.name, link }),
  })
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new Error('TOKEN_INVALIDO')
  }

  const passwordHash = await bcrypt.hash(novaSenha, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    }),
    // Revoga todas as sessões ativas — força novo login em todos os dispositivos
    prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])

  enviarEmail({
    to: stored.user.email,
    subject: 'Senha alterada com sucesso — iTrusty',
    html: templateSenhaAlterada({ nome: stored.user.name }),
  })
}

// ─── Verificação de email ─────────────────────────────────────────────────────

export async function criarTokenVerificacao(
  userId: string,
  email: string,
  nome: string
): Promise<void> {
  // Invalida tokens anteriores
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_MS)

  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt },
  })

  const link = `${DEEP_LINK}://verificar-email?token=${token}`

  enviarEmail({
    to: email,
    subject: 'Confirme seu email — iTrusty',
    html: templateVerificacaoEmail({ nome, link }),
  })
}

export async function verificarEmail(token: string): Promise<void> {
  const stored = await prisma.emailVerificationToken.findUnique({
    where: { token },
  })

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new Error('TOKEN_INVALIDO')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    }),
  ])
}

export async function reenviarVerificacao(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, emailVerified: true },
  })

  if (!user) throw new Error('USUARIO_NAO_ENCONTRADO')
  if (user.emailVerified) throw new Error('EMAIL_JA_VERIFICADO')

  await criarTokenVerificacao(user.id, user.email, user.name)
}
