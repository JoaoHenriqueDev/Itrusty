import { prisma } from './prisma'
import { enviarPush } from './push'

// Criação nunca quebra o fluxo principal — erro é silencioso
export async function criarNotificacao(userId: string, titulo: string, corpo: string) {
  const [notif, user] = await Promise.all([
    prisma.notificacao.create({ data: { userId, titulo, corpo } }).catch(() => null),
    prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } }),
  ])

  if (user?.fcmToken) {
    await enviarPush({ to: user.fcmToken, title: titulo, body: corpo })
  }

  return notif
}