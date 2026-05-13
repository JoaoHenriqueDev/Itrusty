import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { AppHeader } from '../../components/ui/AppHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonMetrics, SkeletonRow } from '../../components/ui/SkeletonCard'
import { useOficina } from '../../hooks/useOficina'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { NotificacaoBanner } from '../../components/NotificacaoBanner'

type Novo = {
  id:            string
  horaInicio:    string
  dataServico:   string
  precoEstimado: number
  motoristaNome: string
  servicoNome:   string
}

type Confirmado = {
  id:            string
  horaInicio:    string
  motoristaNome: string
  servicoNome:   string
}

type Dashboard = {
  faturamento:  number
  atendimentos: number
  novos:        Novo[]
  confirmados:  Confirmado[]
}

const DIAS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatarHoje() {
  const d = new Date()
  return `Hoje, ${DIAS[d.getDay()].toLowerCase()} ${d.getDate()} ${MESES[d.getMonth()]}`
}

export default function HomeOficina() {
  const { user }    = useAuth()
  const router      = useRouter()
  const insets      = useSafeAreaInsets()
  const { oficina } = useOficina()
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes()

  const [dados,   setDados]   = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(false)
  const [acao,    setAcao]    = useState<string | null>(null)

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true)
    try {
      const res = await api.get<Dashboard>('/oficina/home')
      setDados(res)
    } catch {} finally {
      setLoading(false)
      setRefresh(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { carregar() }, [carregar]))

  async function handleAceitar(id: string) {
    setAcao(id)
    try {
      await api.patch(`/oficina/agendamentos/${id}/aceitar`, {})
      await carregar()
    } catch {} finally { setAcao(null) }
  }

  async function handleRecusar(id: string) {
    setAcao(id)
    try {
      await api.patch(`/oficina/agendamentos/${id}/recusar`, {})
      await carregar()
    } catch {} finally { setAcao(null) }
  }

  const primeiraNotif = notificacoes[0]
  const titulo = oficina?.nome ?? user?.name?.split(' ')[0] ?? 'Oficina'

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        titulo={`Olá, ${titulo}`}
        subtitulo={oficina?.cidade ?? undefined}
        naoLidas={naoLidas}
      />

      {primeiraNotif && (
        <NotificacaoBanner
          titulo={primeiraNotif.titulo}
          corpo={primeiraNotif.corpo}
          onDismiss={() => marcarLida(primeiraNotif.id)}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => carregar(true)} tintColor={Colors.accent} />
        }
      >
        <Text style={s.titulo}>{formatarHoje()}</Text>

        {/* Métricas */}
        {loading ? (
          <>
            <SkeletonMetrics />
            {[0,1].map(i => <SkeletonRow key={i} />)}
          </>
        ) : (
          <>
            <View style={s.metricas}>
              <TouchableOpacity
                style={[s.metrica, s.metricaLarga]}
                onPress={() => router.push('/(oficina)/faturamento' as any)}
                activeOpacity={0.8}
              >
                <Text style={s.metricaLabel}>Faturamento</Text>
                <Text style={s.metricaValor}>
                  R$ {(dados?.faturamento ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={s.metricaDetalhe}>Ver detalhes →</Text>
              </TouchableOpacity>
              <View style={[s.metrica, s.metricaCompacta]}>
                <Text style={s.metricaLabel}>Atendimentos</Text>
                <Text style={s.metricaValorGrande}>{dados?.atendimentos ?? 0}</Text>
              </View>
            </View>

            {/* Novos agendamentos */}
            {(dados?.novos?.length ?? 0) > 0 && (
              <>
                <Text style={s.secao}>NOVOS · AGUARDANDO RESPOSTA</Text>
                {dados!.novos.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={s.cardNovo}
                    onPress={() => router.push(`/(oficina)/agendamento/${a.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <View style={s.cardNovoTag}>
                      <Text style={s.cardNovoTagTexto}>NOVO</Text>
                    </View>
                    <View style={s.cardNovoBody}>
                      <View style={s.cardNovoInfo}>
                        <Text style={s.cardNovoNome}>{a.motoristaNome}</Text>
                        <Text style={s.cardNovoServico}>{a.servicoNome}</Text>
                      </View>
                      <View style={s.cardNovoRight}>
                        <Text style={s.cardNovoHora}>{a.horaInicio}</Text>
                        <Text style={s.cardNovoPreco}>R${a.precoEstimado}</Text>
                      </View>
                    </View>
                    <View style={s.acoes}>
                      <TouchableOpacity
                        style={s.recusarBtn}
                        onPress={() => handleRecusar(a.id)}
                        disabled={acao === a.id}
                      >
                        <Text style={s.recusarTexto}>RECUSAR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.aceitarBtn, acao === a.id && { opacity: 0.6 }]}
                        onPress={() => handleAceitar(a.id)}
                        disabled={acao === a.id}
                      >
                        {acao === a.id
                          ? <ActivityIndicator size="small" color={Colors.surface} />
                          : <>
                              <Ionicons name="checkmark" size={15} color={Colors.surface} />
                              <Text style={s.aceitarTexto}>Aceitar</Text>
                            </>
                        }
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Confirmados hoje */}
            {(dados?.confirmados?.length ?? 0) > 0 && (
              <>
                <Text style={s.secao}>CONFIRMADOS · HOJE</Text>
                {dados!.confirmados.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={s.cardConfirmado}
                    onPress={() => router.push(`/(oficina)/agendamento/${a.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.confHora}>{a.horaInicio}</Text>
                    <Text style={s.confNome}>{a.motoristaNome}</Text>
                    <Text style={s.confServico} numberOfLines={1}>{a.servicoNome}</Text>
                    <View style={s.dotVerde} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {!dados?.novos?.length && !dados?.confirmados?.length && (
              <EmptyState
                icon="calendar-outline"
                titulo="Nenhum agendamento hoje"
                descricao="Novos pedidos aparecerão aqui assim que chegarem."
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  scroll:            { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  titulo:            { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.base, marginTop: Spacing.sm },

  metricas:          { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  metrica:           { backgroundColor: Colors.primary, borderRadius: Radii.lg, padding: Spacing.base },
  metricaLarga:      { flex: 1.4 },
  metricaCompacta:   { flex: 0.8 },
  metricaLabel:      { fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.sm },
  metricaValor:      { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, color: Colors.surface },
  metricaValorGrande:{ fontSize: Typography.size['4xl'], fontWeight: Typography.weight.extrabold, color: Colors.surface },
  metricaDetalhe:    { fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.5)', marginTop: Spacing.xs },

  secao:             { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.xs },

  cardNovo:          { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardNovoTag:       { alignSelf: 'flex-start', backgroundColor: Colors.accentLight, borderRadius: Radii.xs, paddingHorizontal: Spacing.sm, paddingVertical: 3, marginBottom: Spacing.sm },
  cardNovoTagTexto:  { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.accent, letterSpacing: 0.6 },
  cardNovoBody:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  cardNovoInfo:      { flex: 1 },
  cardNovoNome:      { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.primary },
  cardNovoServico:   { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  cardNovoRight:     { alignItems: 'flex-end' },
  cardNovoHora:      { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  cardNovoPreco:     { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },

  acoes:             { flexDirection: 'row', gap: Spacing.sm },
  recusarBtn:        { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  recusarTexto:      { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textSecondary, letterSpacing: 0.5 },
  aceitarBtn:        { flex: 2, flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.sm + 2, justifyContent: 'center', alignItems: 'center', gap: Spacing.xs },
  aceitarTexto:      { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.surface },

  cardConfirmado:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  confHora:          { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary, width: 44 },
  confNome:          { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary, flex: 1 },
  confServico:       { fontSize: Typography.size.sm, color: Colors.textSecondary },
  dotVerde:          { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
})
