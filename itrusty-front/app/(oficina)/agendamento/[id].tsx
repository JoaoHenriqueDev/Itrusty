import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../../constants/theme'
import { useAppAlert } from '../../../components/ui/AppAlert'

type Detalhe = {
  id:            string
  dataServico:   string
  horaInicio:    string
  horaFim:       string
  status:        string
  observacao:    string | null
  precoEstimado: number
  motorista:     { nome: string; telefone: string | null }
  veiculo:       { marca: string; modelo: string; ano: number; placa: string }
  servico:       { nome: string; duracaoMinutos: number; preco: number }
}

const DIAS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatarData(iso: string) {
  const d = new Date(iso)
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`
}

function formatarDuracao(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

export default function DetalheAgendamento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { alert } = useAppAlert()
  const [ag,      setAg]      = useState<Detalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [acao,    setAcao]    = useState(false)

  useEffect(() => {
    api.get<Detalhe>(`/oficina/agendamentos/${id}`)
      .then(setAg)
      .catch(() => router.navigate('/(oficina)/' as any))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAceitar() {
    setAcao(true)
    try {
      await api.patch(`/oficina/agendamentos/${id}/aceitar`, {})
      setAg(prev => prev ? { ...prev, status: 'CONFIRMADO' } : prev)
    } catch {} finally { setAcao(false) }
  }

  async function handleRecusar() {
    setAcao(true)
    try {
      await api.patch(`/oficina/agendamentos/${id}/recusar`, {})
      router.navigate('/(oficina)/' as any)
    } catch {} finally { setAcao(false) }
  }

  async function handleFinalizar() {
    setAcao(true)
    try {
      await api.patch(`/oficina/agendamentos/${id}/finalizar`, {})
      router.navigate('/(oficina)/' as any)
    } catch (err: any) {
      alert('Erro', err.message ?? 'Não foi possível finalizar o serviço.')
    } finally { setAcao(false) }
  }

  if (loading || !ag) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  const inicial = ag.motorista.nome.charAt(0).toUpperCase()

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => router.navigate('/(oficina)/' as any)}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {ag.motorista.telefone ? (
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => Linking.openURL(`tel:${ag.motorista.telefone}`)}
            accessibilityLabel="Ligar para o motorista"
            accessibilityRole="button"
          >
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : <View style={s.iconBtn} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Subtítulo + título */}
        <Text style={s.data}>
          {formatarData(ag.dataServico)} · {ag.horaInicio}
        </Text>
        <Text style={s.titulo}>
          {ag.servico.nome}{'\n'}pra {ag.motorista.nome.split(' ')[0]} {ag.motorista.nome.split(' ').at(-1)?.[0]}.
        </Text>

        {/* Card motorista + veículo */}
        <View style={s.card}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarLetra}>{inicial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.motoristaNome}>{ag.motorista.nome}</Text>
              {ag.motorista.telefone && (
                <Text style={s.motoristaTelefone}>{ag.motorista.telefone}</Text>
              )}
            </View>
          </View>

          <View style={s.divisor} />

          <View style={s.veiculoRow}>
            <View style={s.veiculoIconBox}>
              <Ionicons name="car-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View>
              <Text style={s.veiculoNome}>
                {ag.veiculo.marca} {ag.veiculo.modelo} {ag.veiculo.ano}
              </Text>
              <Text style={s.placa}>{ag.veiculo.placa}</Text>
            </View>
          </View>
        </View>

        {/* Observação */}
        {ag.observacao && (
          <>
            <Text style={s.secaoLabel}>OBSERVAÇÃO DO CLIENTE</Text>
            <View style={s.obsBox}>
              <Text style={s.obsTexto}>{ag.observacao}</Text>
            </View>
          </>
        )}

        {/* Resumo do serviço */}
        <View style={s.resumo}>
          {[
            { key: 'SERVIÇO',    val: ag.servico.nome },
            { key: 'DURAÇÃO',    val: formatarDuracao(ag.servico.duracaoMinutos) },
            { key: 'VALOR',      val: `R$ ${ag.precoEstimado.toFixed(2).replace('.', ',')}` },
          ].map(({ key, val }, i, arr) => (
            <View key={key} style={[s.resumoLinha, i < arr.length - 1 && s.resumoLinhaBorda]}>
              <Text style={s.resumoKey}>{key}</Text>
              <Text style={s.resumoVal}>{val}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Rodapé de ações */}
      <View style={s.rodape}>
        {ag.status === 'AGUARDANDO' && (
          <View style={s.acoesRow}>
            <TouchableOpacity
              style={s.recusarBtn}
              onPress={handleRecusar}
              disabled={acao}
            >
              <Text style={s.recusarTexto}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.aceitarBtn, acao && { opacity: 0.6 }]}
              onPress={handleAceitar}
              disabled={acao}
            >
              {acao
                ? <ActivityIndicator size="small" color={Colors.surface} />
                : <>
                    <Ionicons name="checkmark" size={18} color={Colors.surface} />
                    <Text style={s.aceitarTexto}>Aceitar agendamento</Text>
                  </>}
            </TouchableOpacity>
          </View>
        )}

        {ag.status === 'CONFIRMADO' && (
          <TouchableOpacity
            style={[s.finalizarBtn, acao && { opacity: 0.6 }]}
            onPress={handleFinalizar}
            disabled={acao}
            activeOpacity={0.8}
          >
            {acao
              ? <ActivityIndicator size="small" color={Colors.surface} />
              : <>
                  <Text style={s.finalizarTexto}>Finalizar serviço</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
                </>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  iconBtn:         { width: 42, height: 42, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  scroll:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  data:            { fontSize: Typography.size.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  titulo:          { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.xl, lineHeight: Typography.size['2xl'] * 1.25 },
  card:            { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadows.sm },
  avatarRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
  avatar:          { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarLetra:     { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, color: Colors.surface },
  motoristaNome:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  motoristaTelefone:{ fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  divisor:         { height: 1, backgroundColor: Colors.borderLight, marginBottom: Spacing.base },
  veiculoRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  veiculoIconBox:  { width: 38, height: 38, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  veiculoNome:     { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary },
  placa:           { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  secaoLabel:      { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  obsBox:          { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  obsTexto:        { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * 1.7 },
  resumo:          { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  resumoLinha:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  resumoLinhaBorda:{ borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  resumoKey:       { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 0.5, fontWeight: Typography.weight.medium },
  resumoVal:       { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary },
  rodape:          { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  acoesRow:        { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.md },
  recusarBtn:      { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center' },
  recusarTexto:    { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text },
  aceitarBtn:      { flex: 2, flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  aceitarTexto:    { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },
  finalizarBtn:    { flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  finalizarTexto:  { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.surface },
})
