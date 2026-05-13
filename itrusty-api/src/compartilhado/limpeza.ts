import { prisma } from './prisma'

export async function limparTokensExpirados() {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}

export function agendarLimpeza(intervalMs = 24 * 60 * 60 * 1000): () => void {
  const id = setInterval(async () => {
    try {
      await limparTokensExpirados()
    } catch {
      // falha silenciosa — não interrompe o servidor
    }
  }, intervalMs)

  return () => clearInterval(id)
}
