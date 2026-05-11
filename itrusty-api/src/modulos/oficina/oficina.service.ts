import { DiaSemana } from '@prisma/client'
import { prisma } from '../../compartilhado/prisma'
import {
  OnboardingOficinaDTO,
  CriarServicoDTO,
  AtualizarServicoDTO,
  AtualizarPerfilDTO,
} from './oficina.dto'
import { criarNotificacao } from '../../compartilhado/notificacoes'

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
  cep: string, rua: string, cidade: string, estado: string,
): Promise<{ lat: number; lng: number } | null> {
  const tentar = async (q: string) => {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'itrusty-api' }, signal: AbortSignal.timeout(5000) },
    )
    const data = await res.json() as { lat: string; lon: string }[]
    return data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
  }

  try {
    return (
      await tentar(`${rua}, ${cidade}, ${estado}, Brasil`) ??
      await tentar(`${cidade}, ${estado}, Brasil`) ??
      await tentar(`${cep.replace(/\D/g, '')}, Brasil`)
    )
  } catch {
    return null
  }
}

// mantém compatibilidade com chamadas antigas
async function geocodificarCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  return geocodificarEndereco(cep, '', '', '')
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
      },
    })
  })

  const coords = await geocodificarEndereco(data.cep, data.rua, data.cidade, data.estado)
  if (coords) {
    await prisma.oficina.update({
      where: { id: oficina.id },
      data:  { latitude: coords.lat, longitude: coords.lng },
    })
  }

  return oficina
}

// ─── perfil ──────────────────────────────────────────────────────────────────

export async function buscarPerfil(userId: string) {
  const oficina = await prisma.oficina.findUnique({
    where:   { userId },
    include: { horarios: { orderBy: { dia: 'asc' } } },
  })
  if (!oficina) throw new Error('OFICINA_NAO_ENCONTRADA')

  return {
    nome:     oficina.nome,
    fotoUrl:  oficina.fotoUrl,
    telefone: oficina.telefone,
    cep:      oficina.cep,
    rua:      oficina.rua,
    numero:   oficina.numero,
    bairro:   oficina.bairro,
    cidade:   oficina.cidade,
    estado:   oficina.estado,
    horarios: oficina.horarios.map(h => ({
      dia:        h.dia,
      aberto:     h.aberto,
      abertura:   h.abertura,
      fechamento: h.fechamento,
    })),
  }
}

export async function atualizarPerfil(userId: string, data: AtualizarPerfilDTO) {
  const oficina = await getOficinaPorUserId(userId)

  if (data.fotoUrl !== undefined) {
    const url = new URL(data.fotoUrl)
    if (!url.hostname.endsWith('.supabase.co')) {
      throw new Error('FOTO_URL_INVALIDA')
    }
  }

  const camposAtualizar: Record<string, any> = {}
  const enderecoCampos = ['nome','fotoUrl','telefone','cep','rua','numero','bairro','cidade','estado'] as const
  for (const campo of enderecoCampos) {
    if (data[campo] !== undefined) camposAtualizar[campo] = data[campo]
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(camposAtualizar).length > 0) {
      await tx.oficina.update({ where: { id: oficina.id }, data: camposAtualizar })
    }

    if (data.horarios?.length) {
      for (const h of data.horarios) {
        await tx.oficinaHorario.upsert({
          where:  { oficinaId_dia: { oficinaId: oficina.id, dia: h.dia as DiaSemana } },
          create: {
            oficinaId:  oficina.id,
            dia:        h.dia as DiaSemana,
            aberto:     h.aberto,
            abertura:   h.abertura,
            fechamento: h.fechamento,
          },
          update: {
            aberto:     h.aberto,
            abertura:   h.abertura,
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
      data.rua     ?? atualizada?.rua     ?? '',
      data.cidade  ?? atualizada?.cidade  ?? '',
      data.estado  ?? atualizada?.estado  ?? '',
    )
    if (coords) {
      await prisma.oficina.update({
        where: { id: oficina.id },
        data:  { latitude: coords.lat, longitude: coords.lng },
      })
    }
  }
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export async function homeDashboard(userId: string) {
  const oficina   = await getOficinaPorUserId(userId)
  const inicioDia = new Date(new Date().toISOString().split('T')[0])
  const fimDia    = new Date(inicioDia)
  fimDia.setDate(fimDia.getDate() + 1)

  const [novos, confirmados, faturamentoAgg, totalAtendimentos] = await Promise.all([
    prisma.agendamento.findMany({
      where:   { oficinaId: oficina.id, status: 'AGUARDANDO' },
      take:    50,
      include: {
        motorista: { include: { user: { select: { name: true } } } },
        servico:   { select: { nome: true } },
        veiculo:   { select: { marca: true, modelo: true, ano: true, placa: true } },
      },
      orderBy: { criadoEm: 'asc' },
    }),
    prisma.agendamento.findMany({
      where: {
        oficinaId:   oficina.id,
        status:      'CONFIRMADO',
        dataServico: { gte: inicioDia, lt: fimDia },
      },
      include: {
        motorista: { include: { user: { select: { name: true } } } },
        servico:   { select: { nome: true } },
      },
      orderBy: { horaInicio: 'asc' },
    }),
    prisma.agendamento.aggregate({
      where: { oficinaId: oficina.id, status: 'CONCLUIDO', dataServico: { gte: inicioDia, lt: fimDia } },
      _sum:  { precoEstimado: true },
    }),
    prisma.agendamento.count({
      where: {
        oficinaId:   oficina.id,
        status:      { in: ['CONFIRMADO', 'CONCLUIDO'] },
        dataServico: { gte: inicioDia, lt: fimDia },
      },
    }),
  ])

  return {
    faturamento:       Number(faturamentoAgg._sum.precoEstimado ?? 0),
    totalAtendimentos,
    novos: novos.map(a => ({
      id:            a.id,
      horaInicio:    a.horaInicio,
      dataServico:   a.dataServico,
      precoEstimado: Number(a.precoEstimado),
      motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
      servicoNome:   a.servico.nome,
      veiculo:       `${a.veiculo.marca} ${a.veiculo.modelo} ${a.veiculo.ano}`,
      placa:         a.veiculo.placa,
    })),
    confirmados: confirmados.map(a => ({
      id:            a.id,
      horaInicio:    a.horaInicio,
      motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
      servicoNome:   a.servico.nome,
    })),
  }
}

// ─── agenda ──────────────────────────────────────────────────────────────────

export async function agendaPorData(userId: string, data: Date) {
  const oficina = await getOficinaPorUserId(userId)
  const fimDia  = new Date(data)
  fimDia.setDate(fimDia.getDate() + 1)

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      oficinaId:   oficina.id,
      dataServico: { gte: data, lt: fimDia },
      status:      { notIn: ['RECUSADO', 'CANCELADO'] },
    },
    include: {
      motorista: { include: { user: { select: { name: true } } } },
      servico:   { select: { nome: true } },
    },
    orderBy: { horaInicio: 'asc' },
  })

  return agendamentos.map(a => ({
    id:            a.id,
    horaInicio:    a.horaInicio,
    horaFim:       a.horaFim,
    status:        a.status,
    motoristaNome: primeiroNomeAbreviado(a.motorista.user.name),
    servicoNome:   a.servico.nome,
  }))
}

export async function detalheAgendamento(userId: string, agendamentoId: string) {
  const oficina = await getOficinaPorUserId(userId)

  const ag = await prisma.agendamento.findFirst({
    where:   { id: agendamentoId, oficinaId: oficina.id },
    include: {
      motorista: { include: { user: { select: { name: true, phone: true } } } },
      veiculo:   { select: { marca: true, modelo: true, ano: true, placa: true } },
      servico:   { select: { nome: true, duracaoMinutos: true, preco: true } },
    },
  })

  if (!ag) throw new Error('AGENDAMENTO_NAO_ENCONTRADO')

  return {
    id:            ag.id,
    dataServico:   ag.dataServico,
    horaInicio:    ag.horaInicio,
    horaFim:       ag.horaFim,
    status:        ag.status,
    observacao:    ag.observacao,
    precoEstimado: Number(ag.precoEstimado),
    motorista: {
      nome:     ag.motorista.user.name,
      telefone: ag.motorista.user.phone,
    },
    veiculo: ag.veiculo,
    servico: {
      nome:           ag.servico.nome,
      duracaoMinutos: ag.servico.duracaoMinutos,
      preco:          Number(ag.servico.preco),
    },
  }
}

// ─── status de agendamento ───────────────────────────────────────────────────

async function mudarStatus(
  userId: string,
  agendamentoId: string,
  novoStatus: 'CONFIRMADO' | 'RECUSADO' | 'CONCLUIDO',
  statusEsperado: 'AGUARDANDO' | 'CONFIRMADO',
) {
  const oficina = await getOficinaPorUserId(userId)

  const ag = await prisma.agendamento.findFirst({
    where:   { id: agendamentoId, oficinaId: oficina.id },
    include: {
      motorista: { select: { userId: true } },
      servico:   { select: { nome: true } },
    },
  })

  if (!ag) throw new Error('AGENDAMENTO_NAO_ENCONTRADO')

  const resultado = await prisma.agendamento.updateMany({
    where: { id: agendamentoId, oficinaId: oficina.id, status: statusEsperado },
    data:  { status: novoStatus },
  })

  if (resultado.count === 0) throw new Error('STATUS_INVALIDO')

  const msgs = {
    CONFIRMADO: { titulo: 'Agendamento confirmado!', corpo: `${oficina.nome} confirmou seu ${ag.servico.nome}.` },
    RECUSADO:   { titulo: 'Agendamento recusado',    corpo: `${oficina.nome} não pôde atender ${ag.servico.nome}.` },
    CONCLUIDO:  { titulo: 'Serviço concluído!',      corpo: `${ag.servico.nome} na ${oficina.nome} foi concluído.` },
  }

  await criarNotificacao(ag.motorista.userId, msgs[novoStatus].titulo, msgs[novoStatus].corpo)
}

export const aceitarAgendamento  = (userId: string, id: string) => mudarStatus(userId, id, 'CONFIRMADO', 'AGUARDANDO')
export const recusarAgendamento  = (userId: string, id: string) => mudarStatus(userId, id, 'RECUSADO',   'AGUARDANDO')
export const finalizarAgendamento = (userId: string, id: string) => mudarStatus(userId, id, 'CONCLUIDO', 'CONFIRMADO')

// ─── serviços ────────────────────────────────────────────────────────────────

export async function listarServicos(userId: string) {
  const oficina  = await getOficinaPorUserId(userId)
  const servicos = await prisma.servico.findMany({
    where:   { oficinaId: oficina.id },
    orderBy: { nome: 'asc' },
  })

  return {
    total:    servicos.length,
    ativos:   servicos.filter(s => s.ativo).length,
    servicos: servicos.map(s => ({
      id:             s.id,
      nome:           s.nome,
      descricao:      s.descricao,
      duracaoMinutos: s.duracaoMinutos,
      preco:          Number(s.preco),
      ativo:          s.ativo,
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

export async function atualizarServico(userId: string, servicoId: string, data: AtualizarServicoDTO) {
  const oficina   = await getOficinaPorUserId(userId)
  const resultado = await prisma.servico.updateMany({
    where: { id: servicoId, oficinaId: oficina.id },
    data,
  })
  if (resultado.count === 0) throw new Error('SERVICO_NAO_ENCONTRADO')

  const s = await prisma.servico.findUnique({ where: { id: servicoId } })
  return { ...s!, preco: Number(s!.preco) }
}

export async function excluirServico(userId: string, servicoId: string) {
  const oficina   = await getOficinaPorUserId(userId)
  const resultado = await prisma.servico.deleteMany({
    where: { id: servicoId, oficinaId: oficina.id },
  })
  if (resultado.count === 0) throw new Error('SERVICO_NAO_ENCONTRADO')
}
