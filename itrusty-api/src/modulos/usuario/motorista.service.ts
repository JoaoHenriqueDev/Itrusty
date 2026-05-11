import { prisma } from '../../compartilhado/prisma'
  import { OnboardingMotoristaDTO, CriarAgendamentoDTO } from './motorista.dto'
  import { criarNotificacao } from '../../compartilhado/notificacoes'

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

const PAGE_SIZE = 20

export async function buscarOficinas(lat?: number, lng?: number, page = 1) {
  const todas = await prisma.oficina.findMany({
    select: {
      id:         true,
      nome:       true,
      bairro:     true,
      cidade:     true,
      fotoUrl:    true,
      categorias: true,
      latitude:   true,
      longitude:  true,
    },
  })

  const ordenadas = todas
    .map(o => ({
      id:          o.id,
      nome:        o.nome,
      bairro:      o.bairro,
      cidade:      o.cidade,
      fotoUrl:     o.fotoUrl,
      categorias:  o.categorias,
      distanciaKm: (lat && lng && o.latitude && o.longitude)
        ? Math.round(calcularDistanciaKm(lat, lng, o.latitude, o.longitude) * 10) / 10
        : null,
    }))
    .sort((a, b) => {
      if (a.distanciaKm === null) return 1
      if (b.distanciaKm === null) return -1
      return a.distanciaKm - b.distanciaKm
    })

  const total = ordenadas.length
  const data  = ordenadas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return {
    data,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  }
}
 function calcularHoraFim(horaInicio: string, duracaoMinutos: number):
  string {
    const [h, m]  = horaInicio.split(':').map(Number)
    const total   = h * 60 + m + duracaoMinutos
    return `${String(Math.floor(total / 60)).padStart(2,
  '0')}:${String(total % 60).padStart(2, '0')}`
  }

export async function buscarDetalheOficina(id: string) {
  const oficina = await prisma.oficina.findUnique({
    where: { id },
    include: {
      servicos: { where: { ativo: true }, orderBy: { nome: 'asc' } },
      horarios: { orderBy: { dia: 'asc' } },
    },
  })
  if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')

  return {
    id:         oficina.id,
    nome:       oficina.nome,
    fotoUrl:    oficina.fotoUrl,
    telefone:   oficina.telefone,
    categorias: oficina.categorias,
    rua:        oficina.rua,
    numero:     oficina.numero,
    bairro:     oficina.bairro,
    cidade:     oficina.cidade,
    estado:     oficina.estado,
    latitude:   oficina.latitude,
    longitude:  oficina.longitude,
    servicos: oficina.servicos.map(s => ({
      id:             s.id,
      nome:           s.nome,
      descricao:      s.descricao,
      duracaoMinutos: s.duracaoMinutos,
      preco:          Number(s.preco),
    })),
    horarios: oficina.horarios.map(h => ({
      dia:        h.dia,
      aberto:     h.aberto,
      abertura:   h.abertura,
      fechamento: h.fechamento,
    })),
  }
}

export async function listarAgendamentosMotorista(userId: string) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const agendamentos = await prisma.agendamento.findMany({
    where:   { motoristaId: motorista.id },
    include: {
      oficina: { select: { nome: true, fotoUrl: true, bairro: true } },
      servico: { select: { nome: true, duracaoMinutos: true } },
      veiculo: { select: { marca: true, modelo: true, placa: true } },
    },
    orderBy: { dataServico: 'desc' },
    take:    50,
  })

  return agendamentos.map(a => ({
    id:            a.id,
    status:        a.status,
    dataServico:   a.dataServico,
    horaInicio:    a.horaInicio,
    horaFim:       a.horaFim,
    precoEstimado: Number(a.precoEstimado),
    observacao:    a.observacao,
    oficina:       a.oficina,
    servico:       a.servico,
    veiculo:       a.veiculo,
  }))
}

export async function buscarVeiculosMotorista(userId: string) {
  const motorista = await prisma.motorista.findUnique({
    where:   { userId },
    include: { veiculos: true },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')
  return motorista.veiculos
}

export async function criarAgendamento(userId: string, data:
  CriarAgendamentoDTO) {
    const motorista = await prisma.motorista.findUnique({
      where:   { userId },
      include: { user: { select: { name: true } } },
    })
    if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

    const veiculo = await prisma.veiculo.findFirst({
      where: { id: data.veiculoId, motoristaId: motorista.id },
    })
    if (!veiculo) throw new Error('VEICULO_NAO_ENCONTRADO')

    const servico = await prisma.servico.findFirst({
      where: { id: data.servicoId, oficinaId: data.oficinaId, ativo: true
  },
    })
    if (!servico) throw new Error('SERVICO_NAO_ENCONTRADO')

    const oficina = await prisma.oficina.findUnique({
      where: { id: data.oficinaId },
    })
    if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')

    const hoje = new Date(new Date().toISOString().split('T')[0])
    if (new Date(data.dataServico) < hoje) throw new Error('DATA_NO_PASSADO')

    const horaFimCalculada = calcularHoraFim(data.horaInicio, servico.duracaoMinutos)

    const agendamento = await prisma.$transaction(async (tx) => {
      const conflito = await tx.agendamento.findFirst({
        where: {
          oficinaId:   data.oficinaId,
          dataServico: new Date(data.dataServico),
          status:      { in: ['AGUARDANDO', 'CONFIRMADO'] },
          horaInicio:  { lt: horaFimCalculada },
          horaFim:     { gt: data.horaInicio },
        },
      })
      if (conflito) throw new Error('HORARIO_INDISPONIVEL')

      return tx.agendamento.create({
        data: {
          motoristaId:   motorista.id,
          oficinaId:     data.oficinaId,
          servicoId:     data.servicoId,
          veiculoId:     data.veiculoId,
          dataServico:   new Date(data.dataServico),
          horaInicio:    data.horaInicio,
          horaFim:       horaFimCalculada,
          observacao:    data.observacao,
          precoEstimado: servico.preco,
        },
      })
    })

    await criarNotificacao(
      oficina.userId,
      'Novo agendamento',
      `${motorista.user.name} agendou ${servico.nome} para ${data.dataServico} às ${data.horaInicio}`,
    )

    return {
      ...agendamento,
      precoEstimado: Number(agendamento.precoEstimado),
    }
  }