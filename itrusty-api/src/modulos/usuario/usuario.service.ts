import { prisma } from '../../compartilhado/prisma'
import { AtualizarUsuarioDTO, AdicionarVeiculoDTO } from './usuario.dto'
import { enviarEmail } from '../../compartilhado/email'
import { templateEmailAlterado } from '../../compartilhado/templates'

export async function atualizarPushToken(userId: string, token: string) {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken: token } })
}

export async function buscarPerfilUsuario(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
  if (!user) throw new Error('USUARIO_NAO_ENCONTRADO')
  return user
}

export async function atualizarPerfilUsuario(userId: string, data: AtualizarUsuarioDTO) {
  const emailNorm = data.email?.toLowerCase().trim()

  // Captura email anterior antes de alterar para enviar notificação
  let emailAnterior: string | null = null
  let nomeAtual = ''
  if (emailNorm) {
    const userAtual = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (userAtual && userAtual.email !== emailNorm) {
      emailAnterior = userAtual.email
      nomeAtual     = userAtual.name
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    if (emailNorm) {
      const existe = await tx.user.findFirst({
        where: { email: emailNorm, NOT: { id: userId } },
      })
      if (existe) throw new Error('EMAIL_JA_CADASTRADO')
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(emailNorm !== undefined && { email: emailNorm }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
  })

  // Notifica o email anterior sobre a alteração (fire-and-forget)
  if (emailAnterior && emailNorm) {
    enviarEmail({
      to: emailAnterior,
      subject: 'Email da conta alterado — iTrusty',
      html: templateEmailAlterado({
        nome:      data.name?.trim() ?? nomeAtual,
        emailNovo: emailNorm,
      }),
    })
  }

  return user
}

export async function adicionarVeiculo(userId: string, data: AdicionarVeiculoDTO) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  try {
    return await prisma.veiculo.create({
      data: {
        motoristaId: motorista.id,
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        placa: data.placa.toUpperCase().trim(),
      },
    })
  } catch (err: any) {
    if (err.code === 'P2002') throw new Error('PLACA_JA_CADASTRADA')
    throw err
  }
}

export async function removerVeiculo(userId: string, veiculoId: string) {
  const motorista = await prisma.motorista.findUnique({
    where: { userId },
    include: { veiculos: true },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')
  if (motorista.veiculos.length <= 1) throw new Error('ULTIMO_VEICULO')

  const veiculo = motorista.veiculos.find((v) => v.id === veiculoId)
  if (!veiculo) throw new Error('VEICULO_NAO_ENCONTRADO')

  await prisma.veiculo.delete({ where: { id: veiculoId } })
}
