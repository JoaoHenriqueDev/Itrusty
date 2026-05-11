import { prisma } from './prisma'
import { enviarPush } from './push'

// Criação nunca quebra o fluxo principal — erro é silencioso
export async function criarNotificacao(userId: string, titulo: string, corpo: string) {
  try {
    const [notif, user] = await Promise.all([
      prisma.notificacao.create({ data: { userId, titulo, corpo } }),
      prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } }),
    ])

    // Só dispara push se a notificação foi criada com sucesso; fire-and-forget
    if (user?.fcmToken) {
      enviarPush({ to: user.fcmToken, title: titulo, body: corpo })
    }

    return notif
  } catch {
    return null
  }
}
