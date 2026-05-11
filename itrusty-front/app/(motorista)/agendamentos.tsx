import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, Image,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/SkeletonCard'

type Agendamento = {
  id:            string
  status:        'AGUARDANDO' | 'CONFIRMADO' | 'RECUSADO' | 'CONCLUIDO' | 'CANCELADO'
  dataServico:   string
  horaInicio:    string
  horaFim:       string
  precoEstimado: number
  oficina:       { nome: string; fotoUrl: string | null; bairro: string }
  servico:       { nome: string; duracaoMinutos: number }
  veiculo:       { marca: string; modelo: string; placa: string }
}

const STATUS_CONFIG = {
  AGUARDANDO: { label: 'Aguardando confirmação', cor: Colors.warning,       icone: 'time-outline'             },
  CONFIRMADO: { label: 'Confirmado',              cor: Colors.success,       icone: 'checkmark-circle-outline' },
  RECUSADO:   { label: 'Recusado',                cor: Colors.error,         icone: 'close-circle-outline'     },
  CONCLUIDO:  { label: 'Concluído',               cor: Colors.textSecondary, icone: 'checkmark-done-outline'   },
  CANCELADO:  { label: 'Cancelado',               cor: Colors.textMuted,     icone: 'ban-outline'              },
} as const

function formatData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Agendamentos() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refresh,      setRefresh]      = useState(false)

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true)
    try {
      const res = await api.get<{ agendamentos: Agendamento[] }>('/motorista/agendamentos')
      setAgendamentos(res.agendamentos ?? [])
    } catch {
      setAgendamentos([])
    } finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [])

  // Recarrega toda vez que a aba ganha foco
  useFocusEffect(useCallback(() => { carregar() }, [carregar]))

  function renderItem({ item }: { item: Agendamento }) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.CANCELADO

    return (
      <View style={s.card}>
        {/* Cabeçalho do card */}
        <View style={s.cardHeader}>
          <View style={s.foto}>
            {item.oficina.fotoUrl
              ? <Image source={{ uri: item.oficina.fotoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <Ionicons name="storefront-outline" size={22} color={Colors.surface} />}
          </View>
          <View style={s.cardHeaderInfo}>
            <Text style={s.oficinaNome} numberOfLines={1}>{item.oficina.nome}</Text>
            <Text style={s.oficinaBairro} numberOfLines={1}>{item.oficina.bairro}</Text>
          </View>
          {/* Badge de status */}
          <View style={[s.badge, { backgroundColor: cfg.cor + '18' }]}>
            <Ionicons name={cfg.icone as any} size={13} color={cfg.cor} />
            <Text style={[s.badgeTexto, { color: cfg.cor }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={s.separador} />

        {/* Detalhes */}
        <View style={s.detalhes}>
          <View style={s.detalhe}>
            <Ionicons name="construct-outline" size={14} color={Colors.accent} />
            <Text style={s.detalheTexto} numberOfLines={1}>{item.servico.nome}</Text>
          </View>
          <View style={s.detalhe}>
            <Ionicons name="car-outline" size={14} color={Colors.accent} />
            <Text style={s.detalheTexto}>{item.veiculo.marca} {item.veiculo.modelo} · {item.veiculo.placa}</Text>
          </View>
          <View style={s.detalheRow}>
            <View style={s.detalhe}>
              <Ionicons name="calendar-outline" size={14} color={Colors.accent} />
              <Text style={s.detalheTexto}>{formatData(item.dataServico)}</Text>
            </View>
            <View style={s.detalhe}>
              <Ionicons name="time-outline" size={14} color={Colors.accent} />
              <Text style={s.detalheTexto}>{item.horaInicio} – {item.horaFim}</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={s.rodape}>
          <Text style={s.precoLabel}>Estimado</Text>
          <Text style={s.preco}>{formatPreco(item.precoEstimado)}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      <Text style={s.titulo}>Meus agendamentos</Text>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {[0,1,2].map(i => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={agendamentos}
          keyExtractor={a => a.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.lista}
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={() => carregar(true)} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              titulo="Nenhum agendamento"
              descricao="Você ainda não fez nenhum agendamento. Explore as oficinas e agende seu serviço!"
              acaoLabel="Ver oficinas"
              onAcao={() => router.replace('/(motorista)')}
            />
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  titulo:          { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  lista:           { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card:            { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base, overflow: 'hidden', ...Shadows.sm },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
  foto:            { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cardHeaderInfo:  { flex: 1, gap: 2 },
  oficinaNome:     { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  oficinaBairro:   { fontSize: Typography.size.xs, color: Colors.textMuted },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs },
  badgeTexto:      { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  separador:       { height: 1, backgroundColor: Colors.borderLight },
  detalhes:        { padding: Spacing.base, gap: Spacing.sm },
  detalheRow:      { flexDirection: 'row', gap: Spacing.xl },
  detalhe:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detalheTexto:    { fontSize: Typography.size.sm, color: Colors.textSecondary },
  rodape:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceMuted, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  precoLabel:      { fontSize: Typography.size.xs, color: Colors.textMuted },
  preco:           { fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold, color: Colors.primary },
})
