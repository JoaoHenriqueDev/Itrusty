import { DiaSemana } from '@prisma/client'
import { prisma } from '../../compartilhado/prisma'
import { OnboardingMotoristaDTO, CriarAgendamentoDTO } from './motorista.dto'
import { criarNotificacao } from '../../compartilhado/notificacoes'

const DIAS_SEMANA: Record<number, DiaSemana> = {
  0: 'DOM',
  1: 'SEG',
  2: 'TER',
  3: 'QUA',
  4: 'QUI',
  5: 'SEX',
  6: 'SAB',
}

export async function onboardingMotorista(userId: string, data: OnboardingMotoristaDTO) {
  return prisma.$transaction(async (tx) => {
    const jaExiste = await tx.motorista.findUnique({ where: { userId } })
    if (jaExiste) throw new Error('PERFIL_JA_CRIADO')
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (user?.role) throw new Error('ROLE_JA_DEFINIDO')
    await tx.user.update({
      where: { id: userId },
      data: { role: 'MOTORISTA' },
    })
    return tx.motorista.create({
      data: {
        userId,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        veiculos: {
          create: {
            marca: data.veiculo.marca,
            modelo: data.veiculo.modelo,
            ano: data.veiculo.ano,
            placa: data.veiculo.placa.toUpperCase().trim(),
          },
        },
      },
      include: { veiculos: true },
    })
  })
}
function calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PAGE_SIZE = 20

const MAX_OFICINAS = 500

export async function buscarOficinas(lat?: number, lng?: number, page = 1) {
  const todas = await prisma.oficina.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    take: MAX_OFICINAS,
    select: {
      id: true,
      nome: true,
      bairro: true,
      cidade: true,
      fotoUrl: true,
      categorias: true,
      latitude: true,
      longitude: true,
    },
  })

  const ordenadas = todas
    .map((o) => ({
      id: o.id,
      nome: o.nome,
      bairro: o.bairro,
      cidade: o.cidade,
      fotoUrl: o.fotoUrl,
      categorias: o.categorias,
      distanciaKm:
        lat != null && lng != null && o.latitude != null && o.longitude != null
          ? Math.round(calcularDistanciaKm(lat, lng, o.latitude, o.longitude) * 10) / 10
          : null,
    }))
    .sort((a, b) => {
      if (a.distanciaKm === null) return 1
      if (b.distanciaKm === null) return -1
      return a.distanciaKm - b.distanciaKm
    })

  const total = ordenadas.length
  const data = ordenadas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return {
    data,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  }
}
function calcularHoraFim(horaInicio: string, duracaoMinutos: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMinutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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
    id: oficina.id,
    nome: oficina.nome,
    fotoUrl: oficina.fotoUrl,
    telefone: oficina.telefone,
    categorias: oficina.categorias,
    rua: oficina.rua,
    numero: oficina.numero,
    bairro: oficina.bairro,
    cidade: oficina.cidade,
    estado: oficina.estado,
    latitude: oficina.latitude,
    longitude: oficina.longitude,
    servicos: oficina.servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      duracaoMinutos: s.duracaoMinutos,
      preco: Number(s.preco),
    })),
    horarios: oficina.horarios.map((h) => ({
      dia: h.dia,
      aberto: h.aberto,
      abertura: h.abertura,
      fechamento: h.fechamento,
    })),
  }
}

export async function listarAgendamentosMotorista(userId: string) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const agendamentos = await prisma.agendamento.findMany({
    where: { motoristaId: motorista.id },
    include: {
      oficina: { select: { nome: true, fotoUrl: true, bairro: true } },
      servico: { select: { nome: true, duracaoMinutos: true } },
      veiculo: { select: { marca: true, modelo: true, placa: true } },
    },
    orderBy: { dataServico: 'desc' },
    take: 50,
  })

  return agendamentos.map((a) => ({
    id: a.id,
    status: a.status,
    dataServico: a.dataServico,
    horaInicio: a.horaInicio,
    horaFim: a.horaFim,
    precoEstimado: Number(a.precoEstimado),
    observacao: a.observacao,
    oficina: a.oficina,
    servico: a.servico,
    veiculo: a.veiculo,
  }))
}

export async function buscarVeiculosMotorista(userId: string) {
  const motorista = await prisma.motorista.findUnique({
    where: { userId },
    include: { veiculos: true },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')
  return motorista.veiculos
}

export async function criarAgendamento(userId: string, data: CriarAgendamentoDTO) {
  const motorista = await prisma.motorista.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: data.veiculoId, motoristaId: motorista.id },
  })
  if (!veiculo) throw new Error('VEICULO_NAO_ENCONTRADO')

  const servico = await prisma.servico.findFirst({
    where: { id: data.servicoId, oficinaId: data.oficinaId, ativo: true },
  })
  if (!servico) throw new Error('SERVICO_NAO_ENCONTRADO')

  const oficina = await prisma.oficina.findUnique({
    where: { id: data.oficinaId },
  })
  if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')

  // Validar que é uma data real do calendário (rejeita ex: 2026-02-31)
  const [ano, mes, dia] = data.dataServico.split('-').map(Number)
  const dataLocal = new Date(ano, mes - 1, dia)
  if (
    dataLocal.getFullYear() !== ano ||
    dataLocal.getMonth() !== mes - 1 ||
    dataLocal.getDate() !== dia
  ) {
    throw new Error('DATA_INVALIDA')
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (dataLocal < hoje) throw new Error('DATA_NO_PASSADO')

  const horaFimCalculada = calcularHoraFim(data.horaInicio, servico.duracaoMinutos)

  // Verificar se a oficina atende no dia da semana
  const diaSemana = DIAS_SEMANA[dataLocal.getDay()]
  const horarioDia = await prisma.oficinaHorario.findUnique({
    where: { oficinaId_dia: { oficinaId: data.oficinaId, dia: diaSemana } },
  })
  if (!horarioDia || !horarioDia.aberto) throw new Error('OFICINA_FECHADA_NO_DIA')

  if (data.horaInicio < horarioDia.abertura || horaFimCalculada > horarioDia.fechamento) {
    throw new Error('FORA_DO_HORARIO')
  }

  // Verificar se o dia está bloqueado
  const bloqueio = await prisma.oficinaBloqueio.findFirst({
    where: { oficinaId: data.oficinaId, data: new Date(data.dataServico) },
  })
  if (bloqueio) throw new Error('DIA_BLOQUEADO')

  const agendamento = await prisma.$transaction(async (tx) => {
    const conflito = await tx.agendamento.findFirst({
      where: {
        oficinaId: data.oficinaId,
        dataServico: new Date(data.dataServico),
        status: { in: ['AGUARDANDO', 'CONFIRMADO'] },
        horaInicio: { lt: horaFimCalculada },
        horaFim: { gt: data.horaInicio },
      },
    })
    if (conflito) throw new Error('HORARIO_INDISPONIVEL')

    return tx.agendamento.create({
      data: {
        motoristaId: motorista.id,
        oficinaId: data.oficinaId,
        servicoId: data.servicoId,
        veiculoId: data.veiculoId,
        dataServico: new Date(data.dataServico),
        horaInicio: data.horaInicio,
        horaFim: horaFimCalculada,
        observacao: data.observacao,
        precoEstimado: servico.preco,
      },
    })
  })

  await criarNotificacao(
    oficina.userId,
    'Novo agendamento',
    `${motorista.user.name} agendou ${servico.nome} para ${data.dataServico} às ${data.horaInicio}`
  )

  return {
    ...agendamento,
    precoEstimado: Number(agendamento.precoEstimado),
  }
}

export async function cancelarAgendamento(userId: string, agendamentoId: string) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const resultado = await prisma.agendamento.updateMany({
    where: {
      id: agendamentoId,
      motoristaId: motorista.id,
      status: { in: ['AGUARDANDO', 'CONFIRMADO'] },
    },
    data: { status: 'CANCELADO' },
  })

  if (resultado.count === 0) throw new Error('AGENDAMENTO_NAO_CANCELAVEL')
}
