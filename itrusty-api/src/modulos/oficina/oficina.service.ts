import { DiaSemana } from '@prisma/client'
import { prisma } from '../../compartilhado/prisma'
import {
  OnboardingOficinaDTO,
  CriarServicoDTO,
  AtualizarServicoDTO,
  AtualizarPerfilDTO,
} from './oficina.dto'
import { criarNotificacao } from '../../compartilhado/notificacoes'
import { enviarEmail } from '../../compartilhado/email'
import {
  templateAgendamentoConfirmado,
  templateAgendamentoRecusado,
  templateServicoFinalizado,
} from '../../compartilhado/templates'

// ─── helpers ─────────────────────────────────────────────────────────────────

function primeiroNomeAbreviado(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(' ')
  if (partes.length === 1) return partes[0]
  return `${partes[0]} ${partes[partes.length - 1][0]}.`
}

async function getOficinaPorUserId(userId: string) {
  const oficina = await prisma.oficina.findUnique({ where: { userId } })
  if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')
  return oficina
}

async function geocodificarEndereco(
  cep: string,
  rua: string,
  numero: string,
  cidade: string,
  estado: string
): Promise<{ lat: number; lng: number } | null> {
  // 1) Google Geocoding API — mais preciso, usa chave já configurada
  const googleKey = process.env.GOOGLE_MAPS_API_KEY
  if (googleKey && rua && cidade) {
    try {
      const endereco = `${rua}, ${numero}, ${cidade}, ${estado}, Brasil`
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(endereco)}&key=${googleKey}`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      const data = (await res.json()) as {
        status: string
        results: { geometry: { location: { lat: number; lng: number } } }[]
      }
      if (data.status === 'OK' && data.results.length) {
        const loc = data.results[0].geometry.location
        return { lat: loc.lat, lng: loc.lng }
      }
    } catch {
      /* cai para Nominatim */
    }
  }

  // 2) Nominatim com número incluído (endereço completo)
  const tentar = async (q: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'itrusty-api' }, signal: AbortSignal.timeout(5000) }
    )
    const data = (await res.json()) as { lat: string; lon: string }[]
    return data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
  }

  try {
    return (
      (await tentar(`${rua}, ${numero}, ${cidade}, ${estado}, Brasil`)) ??
      (await tentar(`${rua}, ${cidade}, ${estado}, Brasil`)) ??
      (await tentar(`${cidade}, ${estado}, Brasil`)) ??
      (await tentar(`${cep.replace(/\D/g, '')}, Brasil`))
    )
  } catch {
    return null
  }
}

// ─── onboarding ──────────────────────────────────────────────────────────────

export async function onboardingOficina(userId: string, data: OnboardingOficinaDTO) {
  const oficina = await prisma.$transaction(async (tx) => {
    const jaExiste = await tx.oficina.findUnique({ where: { userId } })
    if (jaExiste) throw new Error('PERFIL_JA_CRIADO')

    const user = await tx.user.findUnique({ where: { id: userId } })
    if (user?.role) throw new Error('ROLE_JA_DEFINIDO')

    await tx.user.update({ where: { id: userId }, data: { role: 'OFICINA' } })

    return tx.oficina.create({
      data: {
        userId,
        nome: data.nome,
        cnpj: data.cnpj,
        telefone: data.telefone,
        categorias: data.categorias,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
      },
    })
  })

  const coords = await geocodificarEndereco(
    data.cep,
    data.rua,
    data.numero,
    data.cidade,
    data.estado
  )
  if (coords) {
    await prisma.oficina.update({
      where: { id: oficina.id },
      data: { latitude: coords.lat, longitude: coords.lng },
    })
  }

  return oficina
}

// ─── perfil ──────────────────────────────────────────────────────────────────

export async function buscarPerfil(userId: string) {
  const oficina = await prisma.oficina.findUnique({
    where: { userId },
    include: { horarios: { orderBy: { dia: 'asc' } } },
  })
  if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')

  return {
    nome: oficina.nome,
    fotoUrl: oficina.fotoUrl,
    telefone: oficina.telefone,
    cep: oficina.cep,
    rua: oficina.rua,
    numero: oficina.numero,
    bairro: oficina.bairro,
    cidade: oficina.cidade,
    estado: oficina.estado,
    capacidade: oficina.capacidade,
    horarios: oficina.horarios.map((h) => ({
      dia: h.dia,
      aberto: h.aberto,
      abertura: h.abertura,
      fechamento: h.fechamento,
    })),
  }
}

export async function atualizarPerfil(userId: string, data: AtualizarPerfilDTO) {
  const oficina = await getOficinaPorUserId(userId)

  if (data.fotoUrl !== undefined) {
    const supabaseHostname = new URL(process.env.SUPABASE_URL!).hostname
    const url = new URL(data.fotoUrl)
    if (url.hostname !== supabaseHostname) {
      throw new Error('FOTO_URL_INVALIDA')
    }
  }

  const camposAtualizar: Record<string, any> = {}
  const enderecoCampos = [
    'nome',
    'fotoUrl',
    'telefone',
    'cep',
    'rua',
    'numero',
    'bairro',
    'cidade',
    'estado',
  ] as const
  for (const campo of enderecoCampos) {
    if (data[campo] !== undefined) camposAtualizar[campo] = data[campo]
  }
  if (data.capacidade !== undefined) camposAtualizar.capacidade = data.capacidade

  await prisma.$transaction(async (tx) => {
    if (Object.keys(camposAtualizar).length > 0) {
      await tx.oficina.update({ where: { id: oficina.id }, data: camposAtualizar })
    }

    if (data.horarios?.length) {
      for (const h of data.horarios) {
        await tx.oficinaHorario.upsert({
          where: { oficinaId_dia: { oficinaId: oficina.id, dia: h.dia as DiaSemana } },
          create: {
            oficinaId: oficina.id,
            dia: h.dia as DiaSemana,
            aberto: h.aberto,
            abertura: h.abertura,
            fechamento: h.fechamento,
          },
          update: {
            aberto: h.aberto,
            abertura: h.abertura,
            fechamento: h.fechamento,
          },
        })
      }
    }
  })

  if (data.cep) {
    const atualizada = await prisma.oficina.findUnique({ where: { id: oficina.id } })
    const coords = await geocodificarEndereco(
      data.cep,
      data.rua ?? atualizada?.rua ?? '',
      data.numero ?? atualizada?.numero ?? '',
      data.cidade ?? atualizada?.cidade ?? '',
      data.estado ?? atualizada?.estado ?? ''
    )
    if (coords) {
      await prisma.oficina.update({
        where: { id: oficina.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      })
    }
  }
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export async function homeDashboard(userId: string) {
  const oficina = await getOficinaPorUserId(userId)
  // Calcula a data de hoje em BRT (UTC-3) e usa meia-noite UTC como limite
  // (dataServico é @db.Date → armazenado como meia-noite UTC)
  const agora = new Date()
  const dataBRT = new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]
  const inicioDia = new Date(`${dataBRT}T00:00:00.000Z`)
  const fimDia    = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000)

  const [novos, confirmados, faturamentoAgg, totalAtendimentos] = await Promise.all([
    prisma.agendamento.findMany({
      where: { oficinaId: oficina.id, status: 'AGUARDANDO' },
      take: 50,
      include: {
        motorista: { include: { user: { select: { name: true } } } },
        servico: { select: { nome: true } },
        veiculo: { select: { marca: true, modelo: true, ano: true, placa: true } },
      },
      orderBy: { criadoEm: 'asc' },
    }),
    prisma.agendamento.findMany({
      where: {
        oficinaId: oficina.id,
        status: 'CONFIRMADO',
        dataServico: { gte: inicioDia, lt: fimDia },
      },
      include: {
        motorista: { include: { user: { select: { name: true } } } },
        servico: { select: { nome: true } },
      },
      orderBy: { horaInicio: 'asc' },
    }),
    // Faturamento: serviços CONCLUÍDOS agendados para hoje
    // Usa dataServico (não atualizadoEm) porque updateMany não atualiza @updatedAt no Prisma 6
    prisma.agendamento.aggregate({
      where: {
        oficinaId: oficina.id,
        status: 'CONCLUIDO',
        dataServico: { gte: inicioDia, lt: fimDia },
      },
      _sum: { precoEstimado: true },
    }),
    // Atendimentos: confirmados + concluídos agendados para hoje
    Promise.all([
      prisma.agendamento.count({
        where: {
          oficinaId: oficina.id,
          status: 'CONFIRMADO',
          dataServico: { gte: inicioDia, lt: fimDia },
        },
      }),
      prisma.agendamento.count({
        where: {
          oficinaId: oficina.id,
          status: 'CONCLUIDO',
          dataServico: { gte: inicioDia, lt: fimDia },
        },
      }),
    ]).then(([confirmados, concluidos]) => confirmados + concluidos),
  ])

  return {
    faturamento: Number(faturamentoAgg._sum.precoEstimado ?? 0),
    atendimentos: totalAtendimentos,
    novos: novos.map((a) => ({
      id: a.id,
      horaInicio: a.horaInicio,
      dataServico: a.dataServico,
      precoEstimado: Number(a.precoEstimado),
      motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
      servicoNome: a.servico.nome,
      veiculo: `${a.veiculo.marca} ${a.veiculo.modelo} ${a.veiculo.ano}`,
      placa: a.veiculo.placa,
    })),
    confirmados: confirmados.map((a) => ({
      id: a.id,
      horaInicio: a.horaInicio,
      motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
      servicoNome: a.servico.nome,
    })),
  }
}

// ─── agenda ──────────────────────────────────────────────────────────────────

export async function agendaPorData(userId: string, data: Date) {
  const oficina = await getOficinaPorUserId(userId)
  const fimDia = new Date(data)
  fimDia.setDate(fimDia.getDate() + 1)

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      oficinaId: oficina.id,
      dataServico: { gte: data, lt: fimDia },
      status: { notIn: ['RECUSADO', 'CANCELADO'] },
    },
    include: {
      motorista: { include: { user: { select: { name: true } } } },
      servico: { select: { nome: true } },
    },
    orderBy: { horaInicio: 'asc' },
  })

  return agendamentos.map((a) => ({
    id: a.id,
    horaInicio: a.horaInicio,
    horaFim: a.horaFim,
    status: a.status,
    motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
    servicoNome: a.servico.nome,
  }))
}

export async function detalheAgendamento(userId: string, agendamentoId: string) {
  const oficina = await getOficinaPorUserId(userId)

  const ag = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, oficinaId: oficina.id },
    include: {
      motorista: { include: { user: { select: { name: true, phone: true } } } },
      veiculo: { select: { marca: true, modelo: true, ano: true, placa: true } },
      servico: { select: { nome: true, duracaoMinutos: true, preco: true } },
    },
  })

  if (!ag) throw new Error('AGENDAMENTO_NAO_ENCONTRADO')

  return {
    id: ag.id,
    dataServico: ag.dataServico,
    horaInicio: ag.horaInicio,
    horaFim: ag.horaFim,
    status: ag.status,
    observacao: ag.observacao,
    precoEstimado: Number(ag.precoEstimado),
    motorista: {
      nome: ag.motorista.user.name,
      telefone: ag.motorista.user.phone,
    },
    veiculo: ag.veiculo,
    servico: {
      nome: ag.servico.nome,
      duracaoMinutos: ag.servico.duracaoMinutos,
      preco: Number(ag.servico.preco),
    },
  }
}

// ─── status de agendamento ───────────────────────────────────────────────────

async function mudarStatus(
  userId: string,
  agendamentoId: string,
  novoStatus: 'CONFIRMADO' | 'RECUSADO' | 'CONCLUIDO',
  statusEsperado: 'AGUARDANDO' | 'CONFIRMADO'
) {
  const oficina = await getOficinaPorUserId(userId)

  const ag = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, oficinaId: oficina.id },
    include: {
      motorista: {
        select: {
          userId: true,
          user: { select: { email: true, name: true } },
        },
      },
      servico: { select: { nome: true } },
    },
  })

  if (!ag) throw new Error('AGENDAMENTO_NAO_ENCONTRADO')

  const resultado = await prisma.agendamento.updateMany({
    where: { id: agendamentoId, oficinaId: oficina.id, status: statusEsperado },
    data: { status: novoStatus },
  })

  if (resultado.count === 0) throw new Error('STATUS_INVALIDO')

  const msgs = {
    CONFIRMADO: {
      titulo: 'Agendamento confirmado!',
      corpo: `${oficina.nome} confirmou seu ${ag.servico.nome}.`,
    },
    RECUSADO: {
      titulo: 'Agendamento recusado',
      corpo: `${oficina.nome} não pôde atender ${ag.servico.nome}.`,
    },
    CONCLUIDO: {
      titulo: 'Serviço concluído!',
      corpo: `${ag.servico.nome} na ${oficina.nome} foi concluído.`,
    },
  }

  await criarNotificacao(ag.motorista.userId, msgs[novoStatus].titulo, msgs[novoStatus].corpo)

  const emailMotorista = ag.motorista.user.email
  const nomeMotorista  = ag.motorista.user.name
  const dataFormatada  = new Date(ag.dataServico).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long',
  })

  if (novoStatus === 'CONFIRMADO') {
    enviarEmail({
      to: emailMotorista,
      subject: 'Agendamento confirmado — iTrusty',
      html: templateAgendamentoConfirmado({
        nomeMotorista, nomeOficina: oficina.nome,
        nomeServico: ag.servico.nome, dataFormatada, horaInicio: ag.horaInicio,
      }),
    })
  } else if (novoStatus === 'RECUSADO') {
    enviarEmail({
      to: emailMotorista,
      subject: 'Agendamento não disponível — iTrusty',
      html: templateAgendamentoRecusado({
        nomeMotorista, nomeOficina: oficina.nome, nomeServico: ag.servico.nome,
      }),
    })
  } else if (novoStatus === 'CONCLUIDO') {
    enviarEmail({
      to: emailMotorista,
      subject: 'Serviço concluído — iTrusty',
      html: templateServicoFinalizado({
        nomeMotorista, nomeOficina: oficina.nome,
        nomeServico: ag.servico.nome, dataFormatada,
      }),
    })
  }
}

export const aceitarAgendamento = (userId: string, id: string) =>
  mudarStatus(userId, id, 'CONFIRMADO', 'AGUARDANDO')
export const recusarAgendamento = (userId: string, id: string) =>
  mudarStatus(userId, id, 'RECUSADO', 'AGUARDANDO')
export const finalizarAgendamento = (userId: string, id: string) =>
  mudarStatus(userId, id, 'CONCLUIDO', 'CONFIRMADO')

// ─── avaliações ──────────────────────────────────────────────────────────────

export async function listarAvaliacoes(userId: string) {
  const oficina = await getOficinaPorUserId(userId)

  const [avaliacoes, stats] = await Promise.all([
    prisma.avaliacao.findMany({
      where: { oficinaId: oficina.id },
      include: { motorista: { include: { user: { select: { name: true } } } } },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    }),
    prisma.avaliacao.aggregate({
      where: { oficinaId: oficina.id },
      _avg: { nota: true },
      _count: true,
    }),
  ])

  // Distribuição por estrela (1 a 5)
  const distribuicao = [1, 2, 3, 4, 5].map(n => ({
    nota: n,
    quantidade: avaliacoes.filter(a => a.nota === n).length,
  }))

  return {
    media:        stats._avg.nota ? Math.round(stats._avg.nota * 10) / 10 : null,
    total:        stats._count,
    distribuicao,
    avaliacoes:   avaliacoes.map(a => ({
      id:            a.id,
      nota:          a.nota,
      comentario:    a.comentario,
      motoristaNome: a.motorista.user.name.split(' ')[0],
      criadoEm:      a.criadoEm,
    })),
  }
}

// ─── faturamento detalhado ───────────────────────────────────────────────────

export async function faturamentoDetalhado(userId: string, periodo: number) {
  const oficina = await getOficinaPorUserId(userId)

  const agora  = new Date()
  const inicio = new Date(agora.getTime() - periodo * 24 * 60 * 60 * 1000)
  const inicioComparacao = new Date(inicio.getTime() - periodo * 24 * 60 * 60 * 1000)

  const [agendamentos, anterior] = await Promise.all([
    prisma.agendamento.findMany({
      where: { oficinaId: oficina.id, status: 'CONCLUIDO', dataServico: { gte: inicio, lte: agora } },
      include: { servico: { select: { nome: true } } },
    }),
    prisma.agendamento.aggregate({
      where: { oficinaId: oficina.id, status: 'CONCLUIDO', dataServico: { gte: inicioComparacao, lt: inicio } },
      _sum: { precoEstimado: true },
    }),
  ])

  const totalReceita   = agendamentos.reduce((s, a) => s + Number(a.precoEstimado), 0)
  const totalServicos  = agendamentos.length
  const receitaAnterior = Number(anterior._sum.precoEstimado ?? 0)

  const comparacao = receitaAnterior > 0
    ? {
        percentual: Math.abs(Math.round(((totalReceita - receitaAnterior) / receitaAnterior) * 100)),
        positivo:   totalReceita >= receitaAnterior,
      }
    : null

  // Gráfico: um ponto por dia do período
  const graficoMap = new Map<string, number>()
  for (let i = 0; i < periodo; i++) {
    const d = new Date(inicio.getTime() + i * 24 * 60 * 60 * 1000)
    const key = new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]
    if (!graficoMap.has(key)) graficoMap.set(key, 0)
  }
  for (const ag of agendamentos) {
    const key = ag.dataServico.toISOString().split('T')[0]
    graficoMap.set(key, (graficoMap.get(key) ?? 0) + Number(ag.precoEstimado))
  }
  const grafico = [...graficoMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, valor]) => ({ data, valor }))

  // Top serviços por receita
  const servicoMap = new Map<string, { nome: string; concluidos: number; receita: number }>()
  for (const ag of agendamentos) {
    const nome  = ag.servico.nome
    const entry = servicoMap.get(nome) ?? { nome, concluidos: 0, receita: 0 }
    entry.concluidos++
    entry.receita += Number(ag.precoEstimado)
    servicoMap.set(nome, entry)
  }
  const topServicos = [...servicoMap.values()].sort((a, b) => b.receita - a.receita).slice(0, 5)

  return { periodo, totalReceita, totalServicos, comparacao, grafico, topServicos }
}

// ─── serviços ────────────────────────────────────────────────────────────────

export async function listarServicos(userId: string) {
  const oficina = await getOficinaPorUserId(userId)
  const servicos = await prisma.servico.findMany({
    where: { oficinaId: oficina.id },
    orderBy: { nome: 'asc' },
  })

  return {
    total: servicos.length,
    ativos: servicos.filter((s) => s.ativo).length,
    servicos: servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      duracaoMinutos: s.duracaoMinutos,
      preco: Number(s.preco),
      ativo: s.ativo,
    })),
  }
}

export async function criarServico(userId: string, data: CriarServicoDTO) {
  const oficina = await getOficinaPorUserId(userId)
  const s = await prisma.servico.create({
    data: { oficinaId: oficina.id, ...data },
  })
  return { ...s, preco: Number(s.preco) }
}

export async function atualizarServico(
  userId: string,
  servicoId: string,
  data: AtualizarServicoDTO
) {
  const oficina = await getOficinaPorUserId(userId)
  const resultado = await prisma.servico.updateMany({
    where: { id: servicoId, oficinaId: oficina.id },
    data,
  })
  if (resultado.count === 0) throw new Error('SERVICO_NAO_ENCONTRADO')

  const s = await prisma.servico.findUnique({ where: { id: servicoId } })
  return { ...s!, preco: Number(s!.preco) }
}

export async function excluirServico(userId: string, servicoId: string) {
  const oficina = await getOficinaPorUserId(userId)
  const resultado = await prisma.servico.deleteMany({
    where: { id: servicoId, oficinaId: oficina.id },
  })
  if (resultado.count === 0) throw new Error('SERVICO_NAO_ENCONTRADO')
}
