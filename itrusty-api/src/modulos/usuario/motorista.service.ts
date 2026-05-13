import { DiaSemana } from '@prisma/client'
import { prisma } from '../../compartilhado/prisma'
import { OnboardingMotoristaDTO, CriarAgendamentoDTO } from './motorista.dto'
import { criarNotificacao } from '../../compartilhado/notificacoes'
import { enviarEmail } from '../../compartilhado/email'
import {
  templateNovoAgendamento,
  templateAgendamentoSolicitado,
  templateAgendamentoCancelado,
} from '../../compartilhado/templates'

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

const PAGE_SIZE    = 20
const MAX_OFICINAS = 500
const RAIO_OSM_M   = 5000  // 5 km
const MAX_EXTERNOS = 15    // máx de resultados OSM por busca
const DEDUP_M      = 250   // ignora OSM se houver interna a menos de 250m

// Cache em memória para resultados do Overpass (TTL 10 min)
const overpassCache = new Map<string, { ts: number; dados: OficinaExterna[] }>()
const CACHE_TTL = 10 * 60 * 1000

type OficinaExterna = {
  id:          string
  nome:        string
  telefone:    string | null
  latitude:    number
  longitude:   number
  tipo:        'EXTERNO'
  bairro:      null
  cidade:      null
  fotoUrl:     null
  categorias:  string[]
  distanciaKm: number | null
}

async function buscarOficinaOSM(lat: number, lng: number): Promise<OficinaExterna[]> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const cached = overpassCache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.dados

  const r = RAIO_OSM_M
  // node = ponto; way = polígono (prédio) — ambos necessários para cobertura completa
  // out body center; retorna tags + coordenadas do centro para ways
  const query = `[out:json][timeout:20];(node["shop"="car_repair"](around:${r},${lat},${lng});node["shop"="tyres"](around:${r},${lat},${lng});node["shop"="car_parts"](around:${r},${lat},${lng});node["shop"="motorcycle_repair"](around:${r},${lat},${lng});node["shop"="motorcycle"](around:${r},${lat},${lng});node["amenity"="car_repair"](around:${r},${lat},${lng});node["craft"="car_repair"](around:${r},${lat},${lng});way["shop"="car_repair"](around:${r},${lat},${lng});way["shop"="tyres"](around:${r},${lat},${lng});way["shop"="car_parts"](around:${r},${lat},${lng});way["amenity"="car_repair"](around:${r},${lat},${lng});way["craft"="car_repair"](around:${r},${lat},${lng}););out body center;`

  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  try {
    let res: Response | null = null
    for (const endpoint of ENDPOINTS) {
      try {
        const params = new URLSearchParams({ data: query })
        res = await fetch(endpoint, {
          method:  'POST',
          headers: { 'User-Agent': 'iTrusty/1.0' },
          body:    params,
          signal:  AbortSignal.timeout(20000),
        })
        if (res.ok) break
        const corpo = await res.text().catch(() => '')
        console.error(`[OSM] ${endpoint} retornou ${res.status}: ${corpo.substring(0, 200)}`)
        res = null
      } catch (e) {
        console.error(`[OSM] Falha em ${endpoint}:`, e)
      }
    }
    if (!res) return []

    type OsmElement = {
      type: string; id: number
      lat?: number; lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }

    const json = await res.json() as { elements?: OsmElement[] }

    const dados: OficinaExterna[] = (json.elements ?? [])
      .map((e): OficinaExterna | null => {
        const elat = e.lat  ?? e.center?.lat
        const elng = e.lon  ?? e.center?.lon
        if (!elat || !elng || !e.tags?.name) return null
        return {
          id:          `osm_${e.id}`,
          nome:        e.tags.name,
          telefone:    e.tags['phone'] ?? e.tags['contact:phone'] ?? null,
          latitude:    elat,
          longitude:   elng,
          tipo:        'EXTERNO' as const,
          bairro:      null,
          cidade:      null,
          fotoUrl:     null,
          categorias:  [],
          distanciaKm: null,
        }
      })
      .filter((e): e is OficinaExterna => e !== null)
      .slice(0, MAX_EXTERNOS)

    console.log(`[OSM] ${dados.length} estabelecimentos encontrados para (${lat.toFixed(3)}, ${lng.toFixed(3)})`)
    overpassCache.set(key, { ts: Date.now(), dados })
    return dados
  } catch (err) {
    console.error('[OSM] Falha ao consultar Overpass:', err)
    return []
  }
}

export async function buscarOficinas(lat?: number, lng?: number, page = 1, externos = true) {
  const internas = await prisma.oficina.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    take: MAX_OFICINAS,
    select: { id: true, nome: true, bairro: true, cidade: true, fotoUrl: true, categorias: true, latitude: true, longitude: true },
  })

  const internasComDist = internas.map(o => ({
    ...o,
    tipo:        'INTERNO' as const,
    distanciaKm: lat != null && lng != null && o.latitude != null && o.longitude != null
      ? Math.round(calcularDistanciaKm(lat, lng, o.latitude, o.longitude) * 10) / 10
      : null,
  }))

  // Busca OSM apenas se houver coordenadas e externos não for desativado
  let externas: OficinaExterna[] = []
  if (lat != null && lng != null && externos) {
    const osmBrutos = await buscarOficinaOSM(lat, lng)

    // Deduplicação: remove OSM que esteja perto de uma interna
    externas = osmBrutos
      .filter(osm => !internas.some(i =>
        i.latitude != null && i.longitude != null &&
        calcularDistanciaKm(osm.latitude, osm.longitude, i.latitude, i.longitude) * 1000 < DEDUP_M
      ))
      .map(osm => ({
        ...osm,
        distanciaKm: Math.round(calcularDistanciaKm(lat, lng, osm.latitude, osm.longitude) * 10) / 10,
      }))
  }

  const todas = [...internasComDist, ...externas].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'INTERNO' ? -1 : 1
    if (a.distanciaKm === null) return 1
    if (b.distanciaKm === null) return -1
    return a.distanciaKm - b.distanciaKm
  })

  const total = todas.length
  const data  = todas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { data, pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) } }
}
function calcularHoraFim(horaInicio: string, duracaoMinutos: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMinutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export async function buscarDetalheOficina(id: string) {
  const [oficina, stats] = await Promise.all([
    prisma.oficina.findUnique({
      where: { id },
      include: {
        servicos: { where: { ativo: true }, orderBy: { nome: 'asc' } },
        horarios: { orderBy: { dia: 'asc' } },
      },
    }),
    prisma.avaliacao.aggregate({
      where: { oficinaId: id },
      _avg: { nota: true },
      _count: true,
    }),
  ])
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
    mediaAvaliacao:  stats._avg.nota ? Math.round(stats._avg.nota * 10) / 10 : null,
    totalAvaliacoes: stats._count,
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
      oficina:   { select: { nome: true, fotoUrl: true, bairro: true } },
      servico:   { select: { nome: true, duracaoMinutos: true } },
      veiculo:   { select: { marca: true, modelo: true, placa: true } },
      avaliacao: { select: { nota: true, comentario: true } },
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
    oficina:   a.oficina,
    servico:   a.servico,
    veiculo:   a.veiculo,
    avaliacao: a.avaliacao ?? null,
  }))
}

export async function criarAvaliacao(userId: string, agendamentoId: string, nota: number, comentario?: string) {
  const motorista = await prisma.motorista.findUnique({ where: { userId } })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const ag = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, motoristaId: motorista.id, status: 'CONCLUIDO' },
  })
  if (!ag) throw new Error('AGENDAMENTO_NAO_ENCONTRADO')

  const existente = await prisma.avaliacao.findUnique({ where: { agendamentoId } })
  if (existente) throw new Error('JA_AVALIADO')

  return prisma.avaliacao.create({
    data: { agendamentoId, motoristaId: motorista.id, oficinaId: ag.oficinaId, nota, comentario },
  })
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
    include: { user: { select: { name: true, email: true } } },
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
    include: { user: { select: { email: true, name: true } } },
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
    const simultaneos = await tx.agendamento.count({
      where: {
        oficinaId: data.oficinaId,
        dataServico: new Date(data.dataServico),
        status: { in: ['AGUARDANDO', 'CONFIRMADO'] },
        horaInicio: { lt: horaFimCalculada },
        horaFim: { gt: data.horaInicio },
      },
    })
    if (simultaneos >= oficina.capacidade) throw new Error('HORARIO_INDISPONIVEL')

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

  const dataFormatada = new Date(data.dataServico).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long',
  })
  enviarEmail({
    to: oficina.user.email,
    subject: 'Novo agendamento recebido — iTrusty',
    html: templateNovoAgendamento({
      nomeGestor:    oficina.user.name,
      nomeMotorista: motorista.user.name,
      nomeServico:   servico.nome,
      dataFormatada,
      horaInicio:    data.horaInicio,
    }),
  })

  enviarEmail({
    to: motorista.user.email,
    subject: 'Solicitação de agendamento enviada — iTrusty',
    html: templateAgendamentoSolicitado({
      nomeMotorista: motorista.user.name,
      nomeOficina:   oficina.nome,
      nomeServico:   servico.nome,
      dataFormatada,
      horaInicio:    data.horaInicio,
    }),
  })

  return {
    ...agendamento,
    precoEstimado: Number(agendamento.precoEstimado),
  }
}

export async function cancelarAgendamento(userId: string, agendamentoId: string) {
  const motorista = await prisma.motorista.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  })
  if (!motorista) throw new Error('PERFIL_NAO_ENCONTRADO')

  const ag = await prisma.agendamento.findFirst({
    where: {
      id: agendamentoId,
      motoristaId: motorista.id,
      status: { in: ['AGUARDANDO', 'CONFIRMADO'] },
    },
    include: {
      oficina: { include: { user: { select: { email: true, name: true } } } },
      servico: { select: { nome: true } },
    },
  })

  if (!ag) throw new Error('AGENDAMENTO_NAO_CANCELAVEL')

  await prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { status: 'CANCELADO' },
  })

  const dataFormatada = new Date(ag.dataServico).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long',
  })

  criarNotificacao(
    ag.oficina.userId,
    'Agendamento cancelado',
    `${motorista.user.name} cancelou ${ag.servico.nome} para ${dataFormatada}.`
  )

  enviarEmail({
    to: ag.oficina.user.email,
    subject: 'Agendamento cancelado — iTrusty',
    html: templateAgendamentoCancelado({
      nomeGestor:    ag.oficina.user.name,
      nomeMotorista: motorista.user.name,
      nomeServico:   ag.servico.nome,
      dataFormatada,
      horaInicio:    ag.horaInicio,
    }),
  })
}
