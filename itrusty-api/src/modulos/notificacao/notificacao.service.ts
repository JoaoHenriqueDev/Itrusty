import { prisma } from '../../compartilhado/prisma'

  export async function listarNaoLidas(userId: string) {
    return prisma.notificacao.findMany({
      where: { userId, lida: false },
      orderBy: { criadaEm: 'desc' },
      take: 20,
    })
  }

  export async function marcarComoLida(id: string, userId: string) {
    const resultado = await prisma.notificacao.updateMany({
      where: { id, userId },
      data:  { lida: true },
    })
    if (resultado.count === 0) throw new Error('NAO_ENCONTRADA')
  }