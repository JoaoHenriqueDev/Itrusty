import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'
import { AppHeader } from '../../components/ui/AppHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { useOficina } from '../../hooks/useOficina'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { NotificacaoBanner } from '../../components/NotificacaoBanner'

type Agendamento = {
  id:            string
  horaInicio:    string
  horaFim:       string
  status:        string
  motoristaNome: string
  servicoNome:   string
}

const DIAS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function semanaAtual(offset: number): Date[] {
  const hoje      = new Date()
  const diaSemana = hoje.getDay()
  const inicio    = new Date(hoje)
  inicio.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + offset * 7)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })
}

function toISO(d: Date) { return d.toISOString().split('T')[0] }
function isHoje(d: Date) { return toISO(d) === toISO(new Date()) }

export default function AgendaOficina() {
  const { user }    = useAuth()
  const router      = useRouter()
  const insets      = useSafeAreaInsets()
  const { oficina } = useOficina()
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes()

  const [semanaOffset, setSemanaOffset] = useState(0)
  const [dias,         setDias]         = useState<Date[]>(() => semanaAtual(0))
  const [selecionado,  setSelecionado]  = useState<Date>(() => new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading,      setLoading]      = useState(false)

  useEffect(() => { setDias(semanaAtual(semanaOffset)) }, [semanaOffset])

  const carregar = useCallback(async (data: Date) => {
    setLoading(true)
    try {
      const res = await api.get<{ agendamentos: Agendamento[] }>('/oficina/agenda', { data: toISO(data) })
      setAgendamentos(res.agendamentos)
    } catch {
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar(selecionado) }, [selecionado, carregar])

  const labelDia = `${DIAS[selecionado.getDay()].toUpperCase()} ${selecionado.getDate()} ${MESES[selecionado.getMonth()].toUpperCase()}`
  const primeiraNotif = notificacoes[0]

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        titulo={`Olá, ${oficina?.nome ?? user?.name?.split(' ')[0] ?? ''}`}
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

      {/* Título + navegação semanal */}
      <View style={s.tituloRow}>
        <Text style={s.titulo}>Agenda</Text>
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => setSemanaOffset(o => o - 1)} accessibilityLabel="Semana anterior">
            <Ionicons name="chevron-back" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => setSemanaOffset(o => o + 1)} accessibilityLabel="Próxima semana">
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de dias */}
      <View style={s.diasRow}>
        {dias.map((d, i) => {
          const sel = toISO(d) === toISO(selecionado)
          return (
            <TouchableOpacity
              key={i}
              style={[s.diaBtn, sel && s.diaBtnSel]}
              onPress={() => setSelecionado(d)}
              accessibilityRole="button"
              accessibilityLabel={`${DIAS[d.getDay()]} ${d.getDate()}`}
              accessibilityState={{ selected: sel }}
            >
              <Text style={[s.diaNome, sel && s.diaTextoSel]}>{DIAS[d.getDay()]}</Text>
              <Text style={[s.diaNum,  sel && s.diaTextoSel]}>{d.getDate()}</Text>
              {isHoje(d) && <View style={[s.dotHoje, sel && { backgroundColor: Colors.accent }]} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={s.labelDia}>
        {labelDia} · {loading ? '...' : `${agendamentos.length} SERVIÇO${agendamentos.length !== 1 ? 'S' : ''}`}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
      ) : agendamentos.length === 0 ? (
        <EmptyState
          icon="time-outline"
          titulo="Nenhum agendamento"
          descricao="Você está livre neste dia."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.lista}>
          {agendamentos.map(a => (
            <TouchableOpacity
              key={a.id}
              style={s.card}
              onPress={() => router.push(`/(oficina)/agendamento/${a.id}` as any)}
              activeOpacity={0.7}
            >
              <Text style={s.hora}>{a.horaInicio}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.nome}>{a.motoristaNome}</Text>
                <Text style={s.servico}>{a.servicoNome}</Text>
              </View>
              <View style={[s.dot, a.status === 'CONFIRMADO' && s.dotConfirmado]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  tituloRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.base },
  titulo:       { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary },
  navRow:       { flexDirection: 'row', gap: Spacing.sm },
  navBtn:       { width: 34, height: 34, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  diasRow:      { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.xs },
  diaBtn:       { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', gap: 3 },
  diaBtnSel:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  diaNome:      { fontSize: Typography.size.xs - 1, fontWeight: Typography.weight.semibold, color: Colors.textMuted },
  diaNum:       { fontSize: Typography.size.lg, fontWeight: Typography.weight.extrabold, color: Colors.primary },
  diaTextoSel:  { color: Colors.surface },
  dotHoje:      { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent },
  labelDia:     { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 0.8, marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  lista:        { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card:         { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  hora:         { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary, width: 44 },
  nome:         { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary },
  servico:      { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  dot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  dotConfirmado:{ backgroundColor: Colors.success },
})
