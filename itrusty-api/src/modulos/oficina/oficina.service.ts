 import { prisma } from '../../compartilhado/prisma'
  import { OnboardingOficinaDTO } from './oficina.dto'
   
export async function onboardingOficina(userId: string, data: OnboardingOficinaDTO) {
    const oficina = await prisma.$transaction(async (tx) => {
      const jaExiste = await tx.oficina.findUnique({ where: { userId } })
      if (jaExiste) throw new Error('PERFIL_JA_CRIADO')

      const user = await tx.user.findUnique({ where: { id: userId } })
      if (user?.role) throw new Error('ROLE_JA_DEFINIDO')

      await tx.user.update({
        where: { id: userId },
        data: { role: 'OFICINA' }
      })

      return tx.oficina.create({
        data: {
          userId,
          nome:       data.nome,
          cnpj:       data.cnpj,
          telefone:   data.telefone,
          categorias: data.categorias,
          cep:        data.cep,
          rua:        data.rua,
          numero:     data.numero,
          bairro:     data.bairro,
          cidade:     data.cidade,
          estado:     data.estado,
        }
      })
    })

    // Geocoding fora da transaction — chamada HTTP não deve bloquear o banco
    const coords = await geocodificarCep(data.cep)
    if (coords) {
      await prisma.oficina.update({
        where: { id: oficina.id },
        data: { latitude: coords.lat, longitude: coords.lng }
      })
    }

    return oficina
  }
   async function geocodificarCep(cep: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const cepLimpo = cep.replace(/\D/g, '')
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${cepLimpo}&country=BR&format=json&limit=1`,
        { headers: { 'User-Agent': 'itrusty-api' } }
      )
      const data = await res.json() as { lat: string; lon: string }[]
      if (!data.length) return null
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {
      return null
    }
  }