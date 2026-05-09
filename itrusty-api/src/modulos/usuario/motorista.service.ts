import { prisma } from '../../compartilhado/prisma'
  import { OnboardingMotoristaDTO } from './motorista.dto'

export async function onboardingMotorista(userId: string, data: OnboardingMotoristaDTO) {
    

return prisma.$transaction(async (tx) => {
  const jaExiste = await tx.motorista.findUnique({ where: { userId } })
    if (jaExiste) throw new Error('PERFIL_JA_CRIADO')
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (user?.role) throw new Error('ROLE_JA_DEFINIDO')
    await tx.user.update({
      where: { id: userId },
      data: { role: 'MOTORISTA' }
    })
    return tx.motorista.create({
      data: {
        userId,
        cep:    data.cep,
        rua:    data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        veiculos: {
          create: {
            marca:  data.veiculo.marca,
            modelo: data.veiculo.modelo,
            ano:    data.veiculo.ano,
            placa:  data.veiculo.placa.toUpperCase().trim(),
          }
        }
      },
      include: { veiculos: true }
    })
  })}
    function calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  export async function buscarOficinas(lat?: number, lng?: number) {
    const oficinas = await prisma.oficina.findMany({
      select: {
        id:         true,
        nome:       true,
        bairro:     true,
        cidade:     true,
        fotoUrl:    true,
        categorias: true,
        latitude:   true,
        longitude:  true,
      }
    })

    return oficinas
      .map(o => ({
        id:          o.id,
        nome:        o.nome,
        bairro:      o.bairro,
        cidade:      o.cidade,
        fotoUrl:     o.fotoUrl,
        categorias:  o.categorias,
        distanciaKm: (lat && lng && o.latitude && o.longitude)
          ? Math.round(calcularDistanciaKm(lat, lng, o.latitude, o.longitude) * 10) / 10
          : null
      }))
      .sort((a, b) => {
        if (a.distanciaKm === null) return 1
        if (b.distanciaKm === null) return -1
        return a.distanciaKm - b.distanciaKm
      })
  }