import { prisma } from '../../compartilhado/prisma'
import { AtualizarUsuarioDTO } from './motorista.dto'

export async function atualizarPushToken(userId: string, token: string) {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken: token } })
}

export async function buscarPerfilUsuario(userId: string) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
  if (!user) throw new Error('USUARIO_NAO_ENCONTRADO')
  return user
}

export async function atualizarPerfilUsuario(userId: string, data: AtualizarUsuarioDTO) {
  if (data.email) {
    const emailNormalizado = data.email.toLowerCase().trim()
    const existe = await prisma.user.findFirst({
      where: { email: emailNormalizado, NOT: { id: userId } },
    })
    if (existe) throw new Error('EMAIL_JA_CADASTRADO')
    data.email = emailNormalizado
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name  !== undefined && { name:  data.name.trim()  }),
      ...(data.email !== undefined && { email: data.email        }),
      ...(data.phone !== undefined && { phone: data.phone.trim() }),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
}

export async function adicionarVeiculo(userId: string, data: { marca: string; modelo: string; ano: number; placa: string }) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const placaNorm = data.placa.toUpperCase().trim()
  const placaExiste = await prisma.veiculo.findFirst({ where: { placa: placaNorm } })
  if (placaExiste) throw new Error('PLACA_JA_CADASTRADA')

  return prisma.veiculo.create({
    data: {
      motoristaId: motorista.id,
      marca:  data.marca,
      modelo: data.modelo,
      ano:    data.ano,
      placa:  placaNorm,
    },
  })
}

export async function removerVeiculo(userId: string, veiculoId: string) {
  const motorista = await prisma.motorista.findUnique({
    where:   { userId },
    include: { veiculos: true },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')
  if (motorista.veiculos.length <= 1) throw new Error('ULTIMO_VEICULO')

  const veiculo = motorista.veiculos.find(v => v.id === veiculoId)
  if (!veiculo) throw new Error('VEICULO_NAO_ENCONTRADO')

  await prisma.veiculo.delete({ where: { id: veiculoId } })
}
