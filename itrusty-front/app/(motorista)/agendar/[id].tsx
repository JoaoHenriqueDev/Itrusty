import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../../constants/theme'
import { useAppAlert } from '../../../components/ui/AppAlert'

type Servico  = { id: string; nome: string; duracaoMinutos: number; preco: number }
type Veiculo  = { id: string; marca: string; modelo: string; ano: number; placa: string }
type Horario  = { dia: string; aberto: boolean; abertura: string | null; fechamento: string | null }
type Oficina  = { id: string; nome: string; servicos: Servico[]; horarios: Horario[] }

const DIAS_SEMANA: Record<number, string> = {
  0: 'DOM', 1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX', 6: 'SAB',
}

function formatPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDuracao(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60); const m = min % 60
  return m ? `${h}h${m}min` : `${h}h`
}

// Gera os próximos N dias (incluindo hoje) no formato YYYY-MM-DD
function gerarDatas(qtd = 14): { label: string; valor: string; diaSemana: string }[] {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const resultado = []
  const hoje = new Date()
  for (let i = 0; i <= qtd; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    const valor = d.toISOString().split('T')[0]
    resultado.push({
      valor,
      label:     i === 0 ? 'Hoje' : `${d.getDate()} ${meses[d.getMonth()]}`,
      diaSemana: dias[d.getDay()],
    })
  }
  return resultado
}

function hojeISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Gera slots de 30 em 30 min das 8h às 17h30
function gerarSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots.filter((s) => s <= '17:30')
}

const DATAS = gerarDatas()
const SLOTS = gerarSlots()

export default function Agendar() {
  const { id: oficinaId, servicoId: servicoIdParam } = useLocalSearchParams<{ id: string; servicoId?: string }>()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { alert } = useAppAlert()

  const [oficina,     setOficina]     = useState<Oficina | null>(null)
  const [veiculos,    setVeiculos]    = useState<Veiculo[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [enviando,    setEnviando]    = useState(false)

  const [servicoId,   setServicoId]   = useState<string>(servicoIdParam ?? '')
  const [veiculoId,   setVeiculoId]   = useState<string>('')
  const [data,        setData]        = useState<string>('')
  const [hora,        setHora]        = useState<string>('')
  const [observacao,  setObservacao]  = useState<string>('')

  useEffect(() => {
    Promise.all([
      api.get<Oficina>(`/motorista/oficinas/${oficinaId}`),
      api.get<{ veiculos: Veiculo[] }>('/motorista/veiculos'),
    ])
      .then(([of, vRes]) => {
        setOficina(of)
        setVeiculos(vRes.veiculos ?? [])
        if (vRes.veiculos?.length === 1) setVeiculoId(vRes.veiculos[0].id)
      })
      .catch(() => alert('Erro', 'Não foi possível carregar os dados.'))
      .finally(() => setLoadingInit(false))
  }, [])

  const horarioDoDia = useMemo(() => {
    if (!data || !oficina?.horarios?.length) return null
    const [ano, mes, dia] = data.split('-').map(Number)
    const diaSemana = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()]
    return oficina.horarios.find((h) => h.dia === diaSemana) ?? null
  }, [data, oficina])

  const semHorariosConfigurados = !oficina?.horarios?.length

  const slotsFiltrados = useMemo(() => {
    let slots = SLOTS

    // Filtra por horário de funcionamento
    if (!semHorariosConfigurados) {
      if (!horarioDoDia || !horarioDoDia.aberto || !horarioDoDia.abertura || !horarioDoDia.fechamento) return []
      const ab = horarioDoDia.abertura.split(':').map((v, i) => i === 0 ? v.padStart(2, '0') : v).join(':')
      const fe = horarioDoDia.fechamento.split(':').map((v, i) => i === 0 ? v.padStart(2, '0') : v).join(':')
      slots = slots.filter(s => s >= ab && s <= fe)
    }

    // Se hoje estiver selecionado, remove slots que já passaram
    if (data === hojeISO()) {
      const agora = new Date()
      const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
      slots = slots.filter(s => s > horaAtual)
    }

    return slots
  }, [horarioDoDia, semHorariosConfigurados, data])

  const servicoSelecionado = oficina?.servicos.find(s => s.id === servicoId)
  const veiculoSelecionado = veiculos.find(v => v.id === veiculoId)
  const pronto = servicoId && veiculoId && data && hora

  async function confirmar() {
    if (!pronto) return
    setEnviando(true)
    try {
      await api.post('/motorista/agendamentos', {
        oficinaId,
        servicoId,
        veiculoId,
        dataServico: data,
        horaInicio:  hora,
        observacao:  observacao.trim() || undefined,
      })
      alert(
        'Agendamento enviado!',
        'Aguarde a confirmação da oficina. Você verá o status na aba Agendamentos.',
        () => router.replace('/(motorista)/agendamentos'),
      )
    } catch (err: any) {
      const msg = err.message === 'Horário indisponível para este serviço'
        ? 'Esse horário já está ocupado. Escolha outro.'
        : (err.message ?? 'Não foi possível criar o agendamento.')
      alert('Ops!', msg)
    } finally {
      setEnviando(false)
    }
  }

  if (loadingInit) {
    return (
      <View style={s.centralize}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitulo} numberOfLines={1}>Agendar serviço</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Oficina */}
        {oficina && (
          <View style={s.sectionCard}>
            <Ionicons name="storefront-outline" size={18} color={Colors.accent} />
            <Text style={s.sectionCardTexto} numberOfLines={1}>{oficina.nome}</Text>
          </View>
        )}

        {/* Serviço */}
        <Text style={s.label}>Serviço</Text>
        <View style={s.opcoesList}>
          {oficina?.servicos.map(sv => (
            <TouchableOpacity
              key={sv.id}
              style={[s.opcaoCard, servicoId === sv.id && s.opcaoSelecionada]}
              onPress={() => setServicoId(sv.id)}
              activeOpacity={0.75}
            >
              <View style={s.opcaoInfo}>
                <Text style={[s.opcaoNome, servicoId === sv.id && s.opcaoNomeSel]}>{sv.nome}</Text>
                <Text style={s.opcaoMeta}>{formatDuracao(sv.duracaoMinutos)}</Text>
              </View>
              <Text style={[s.opcaoPreco, servicoId === sv.id && s.opcaoPrecSel]}>
                {formatPreco(sv.preco)}
              </Text>
              {servicoId === sv.id && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Veículo */}
        <Text style={s.label}>Veículo</Text>
        <View style={s.opcoesList}>
          {veiculos.map(v => (
            <TouchableOpacity
              key={v.id}
              style={[s.opcaoCard, veiculoId === v.id && s.opcaoSelecionada]}
              onPress={() => setVeiculoId(v.id)}
              activeOpacity={0.75}
            >
              <Ionicons name="car-outline" size={20} color={veiculoId === v.id ? Colors.accent : Colors.textMuted} />
              <View style={[s.opcaoInfo, { marginLeft: Spacing.sm }]}>
                <Text style={[s.opcaoNome, veiculoId === v.id && s.opcaoNomeSel]}>
                  {v.marca} {v.modelo}
                </Text>
                <Text style={s.opcaoMeta}>{v.placa} · {v.ano}</Text>
              </View>
              {veiculoId === v.id && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Data */}
        <Text style={s.label}>Data</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.datesRow}>
          {DATAS.map(d => (
            <TouchableOpacity
              key={d.valor}
              style={[s.dateChip, data === d.valor && s.dateChipSel]}
              onPress={() => { setData(d.valor); setHora('') }}
              activeOpacity={0.75}
            >
              <Text style={[s.dateDia, data === d.valor && s.dateDiaSel]}>{d.diaSemana}</Text>
              <Text style={[s.dateLabel, data === d.valor && s.dateLabelSel]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Horário */}
        {data !== '' && (
          <>
            <Text style={s.label}>Horário</Text>
            {!semHorariosConfigurados && (!horarioDoDia || !horarioDoDia.aberto) ? (
              <View style={s.fechadoCard}>
                <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
                <Text style={s.fechadoTexto}>Oficina fechada neste dia</Text>
              </View>
            ) : (
              <View style={s.slotsGrid}>
                {slotsFiltrados.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[s.slotChip, hora === slot && s.slotChipSel]}
                    onPress={() => setHora(slot)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.slotTexto, hora === slot && s.slotTextoSel]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Observação */}
        <Text style={s.label}>Observação <Text style={s.opcional}>(opcional)</Text></Text>
        <TextInput
          style={s.obsInput}
          placeholder="Descreva o problema ou detalhe do serviço..."
          placeholderTextColor={Colors.textMuted}
          value={observacao}
          onChangeText={setObservacao}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Resumo */}
        {pronto && servicoSelecionado && veiculoSelecionado && (
          <View style={s.resumoCard}>
            <Text style={s.resumoTitulo}>Resumo do agendamento</Text>
            {[
              { icon: 'construct-outline', texto: servicoSelecionado.nome },
              { icon: 'car-outline',       texto: `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} · ${veiculoSelecionado.placa}` },
              { icon: 'calendar-outline',  texto: DATAS.find(d => d.valor === data)?.label ?? data },
              { icon: 'time-outline',      texto: hora },
              { icon: 'cash-outline',      texto: formatPreco(servicoSelecionado.preco) },
            ].map(({ icon, texto }) => (
              <View key={icon} style={s.resumoLinha}>
                <Ionicons name={icon as any} size={16} color={Colors.accent} />
                <Text style={s.resumoTexto}>{texto}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Botão confirmar */}
        <TouchableOpacity
          style={[s.confirmarBtn, !pronto && s.confirmarBtnDesabilitado]}
          onPress={confirmar}
          disabled={!pronto || enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color={Colors.surface} />
            : <Text style={s.confirmarBtnTexto}>Confirmar agendamento</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:            { flex: 1, backgroundColor: Colors.background },
  centralize:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitulo:         { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, flex: 1, textAlign: 'center' },
  scroll:               { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionCard:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.accentLight, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.base },
  sectionCardTexto:     { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.accentDark, flex: 1 },
  label:                { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.base },
  opcional:             { fontWeight: Typography.weight.regular, color: Colors.textMuted },
  opcoesList:           { gap: Spacing.sm, marginBottom: Spacing.sm },
  opcaoCard:            { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.base, ...Shadows.sm },
  opcaoSelecionada:     { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  opcaoInfo:            { flex: 1 },
  opcaoNome:            { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text },
  opcaoNomeSel:         { color: Colors.accentDark },
  opcaoMeta:            { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  opcaoPreco:           { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textSecondary },
  opcaoPrecSel:         { color: Colors.accentDark },
  datesRow:             { gap: Spacing.sm, paddingBottom: Spacing.sm },
  dateChip:             { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, minWidth: 60 },
  dateChipSel:          { borderColor: Colors.accent, backgroundColor: Colors.accent },
  dateDia:              { fontSize: Typography.size.xs, color: Colors.textMuted, fontWeight: Typography.weight.medium },
  dateDiaSel:           { color: Colors.surface },
  dateLabel:            { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.bold, marginTop: 2 },
  dateLabelSel:         { color: Colors.surface },
  slotsGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  fechadoCard:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm },
  fechadoTexto:         { fontSize: Typography.size.sm, color: Colors.textMuted },
  slotChip:             { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, minWidth: 72, alignItems: 'center' },
  slotChipSel:          { borderColor: Colors.accent, backgroundColor: Colors.accent },
  slotTexto:            { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.medium },
  slotTextoSel:         { color: Colors.surface, fontWeight: Typography.weight.bold },
  obsInput:             { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.base, fontSize: Typography.size.sm, color: Colors.text, minHeight: 80, textAlignVertical: 'top' },
  resumoCard:           { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginTop: Spacing.base, gap: Spacing.sm, ...Shadows.sm },
  resumoTitulo:         { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary, marginBottom: Spacing.xs },
  resumoLinha:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resumoTexto:          { fontSize: Typography.size.sm, color: Colors.textSecondary, flex: 1 },
  confirmarBtn:         { backgroundColor: Colors.accent, borderRadius: Radii.full, padding: Spacing.base, alignItems: 'center', marginTop: Spacing.lg },
  confirmarBtnDesabilitado: { backgroundColor: Colors.border },
  confirmarBtnTexto:    { color: Colors.surface, fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
})
