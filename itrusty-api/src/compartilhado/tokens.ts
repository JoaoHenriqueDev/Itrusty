import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { prisma } from './prisma'

const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export async function gerarTokens(app: FastifyInstance, userId: string, role: string | null) {
  const accessToken  = app.jwt.sign({ id: userId, role }, { expiresIn: '15m' })
  const refreshToken = randomUUID()
  const expiresAt    = new Date(Date.now() + REFRESH_EXPIRY_MS)

  await prisma.refreshToken.create({ data: { userId, token: refreshToken, expiresAt } })

  return { accessToken, refreshToken }
}
