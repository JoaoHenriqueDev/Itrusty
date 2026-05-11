  import { prisma } from './prisma'

  // Criação nunca quebra o fluxo principal — erro é silencioso
  export async function criarNotificacao(userId: string, titulo: string, corpo: string) {
    return prisma.notificacao.create({ data: { userId, titulo, corpo } }).catch(() => {})
  }