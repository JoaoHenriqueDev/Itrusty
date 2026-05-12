import { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { useAppAlert } from '../../components/ui/AppAlert'

type GraficoPonto = { data: string; valor: number }
type TopServico   = { nome: string; concluidos: number; receita: number }
type Comparacao   = { percentual: number; positivo: boolean }

type FaturamentoData = {
  periodo:       number
  totalReceita:  number
  totalServicos: number
  comparacao:    Comparacao | null
  grafico:       GraficoPonto[]
  topServicos:   TopServico[]
}

const PERIODOS = [
  { label: '7d',  valor: 7,  descricao: 'ÚLTIMOS 7 DIAS'    },
  { label: '14d', valor: 14, descricao: 'ÚLTIMAS 2 SEMANAS' },
  { label: '30d', valor: 30, descricao: 'ÚLTIMO MÊS'        },
]

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

function mesAtual() { return MESES[new Date().getMonth()] }

function formatarMoeda(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dataCurta(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(d)} ${MESES[Number(m) - 1]}`
}

const BARRA_MAX = 96

function BarChart({ dados }: { dados: GraficoPonto[] }) {
  if (!dados.length) return null
  const max = Math.max(...dados.map(d => d.valor), 1)
  const hoje = new Date().toISOString().split('T')[0]

  const step = dados.length <= 7 ? 1 : dados.length <= 14 ? 2 : 5
  const labelSet = new Set<number>()
  labelSet.add(0)
  labelSet.add(dados.length - 1)
  for (let i = step; i < dados.length - 1; i += step) labelSet.add(i)

  return (
    <View style={bc.container}>
      <View style={bc.barsRow}>
        {dados.map((p, i) => {
          const h   = p.valor > 0 ? Math.max((p.valor / max) * BARRA_MAX, 6) : 3
          const hot = p.data === hoje
          return (
            <View key={p.data} style={bc.col}>
              <View style={[bc.barra, { height: h }, hot ? bc.barHot : p.valor > 0 ? bc.barOn : bc.barOff]} />
            </View>
          )
        })}
      </View>
      <View style={bc.labelsRow}>
        {dados.map((p, i) => (
          <View key={p.data} style={bc.col}>
            {labelSet.has(i) && <Text style={bc.label}>{dataCurta(p.data)}</Text>}
          </View>
        ))}
      </View>
    </View>
  )
}

const bc = StyleSheet.create({
  container: { marginTop: Spacing.base },
  barsRow:   { flexDirection: 'row', alignItems: 'flex-end', height: BARRA_MAX + 4, gap: 3 },
  col:       { flex: 1, alignItems: 'center' },
  barra:     { width: '100%', borderRadius: 3 },
  barOff:    { backgroundColor: Colors.border },
  barOn:     { backgroundColor: Colors.primary, opacity: 0.3 },
  barHot:    { backgroundColor: Colors.accent },
  labelsRow: { flexDirection: 'row', marginTop: Spacing.sm, gap: 3 },
  label:     { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
})

export default function Faturamento() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { alert } = useAppAlert()

  const [periodo,  setPeriodo]  = useState(30)
  const [dados,    setDados]    = useState<FaturamentoData | null>(null)
  const [loading,  setLoading]  = useState(true)

  const carregar = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await api.get<FaturamentoData>(`/oficina/faturamento?periodo=${p}`)
      setDados(res)
    } catch {
      alert('Erro', 'Não foi possível carregar o faturamento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { carregar(periodo) }, [periodo]))

  function selecionarPeriodo(p: number) {
    setPeriodo(p)
  }

  const periodoInfo = PERIODOS.find(p => p.valor === periodo)!

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.navigate('/(oficina)/' as any)} hitSlop={12} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>FATURAMENTO · {mesAtual()}</Text>
        <View style={s.headerBtn} />
      </View>

      {loading ? (
        <View style={s.centralize}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Hero */}
          <View style={s.hero}>
            {dados?.comparacao && (
              <View style={[s.chip, dados.comparacao.positivo ? s.chipPos : s.chipNeg]}>
                <Ionicons
                  name={dados.comparacao.positivo ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={dados.comparacao.positivo ? Colors.success : Colors.error}
                />
                <Text style={[s.chipTexto, dados.comparacao.positivo ? s.chipTextoPos : s.chipTextoNeg]}>
                  {dados.comparacao.positivo ? '+' : '-'}{dados.comparacao.percentual}% VS PERÍODO ANTERIOR
                </Text>
              </View>
            )}
            <Text style={s.totalValor}>{formatarMoeda(dados?.totalReceita ?? 0)}</Text>
            <Text style={s.totalSub}>
              Receita do período · {dados?.totalServicos ?? 0} {dados?.totalServicos === 1 ? 'serviço concluído' : 'serviços concluídos'}
            </Text>
          </View>

          {/* Gráfico */}
          <View style={s.card}>
            <View style={s.graficoHeader}>
              <Text style={s.graficoLabel}>{periodoInfo.descricao}</Text>
              <View style={s.tabs}>
                {PERIODOS.map(p => (
                  <TouchableOpacity
                    key={p.valor}
                    style={[s.tab, periodo === p.valor && s.tabAtivo]}
                    onPress={() => selecionarPeriodo(p.valor)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.tabTexto, periodo === p.valor && s.tabTextoAtivo]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <BarChart dados={dados?.grafico ?? []} />
          </View>

          {/* Top serviços */}
          {(dados?.topServicos?.length ?? 0) > 0 && (
            <View style={s.card}>
              <Text style={s.secaoLabel}>TOP SERVIÇOS</Text>
              {dados!.topServicos.map((sv, i) => (
                <View key={sv.nome} style={[s.servicoRow, i < dados!.topServicos.length - 1 && s.servicoRowBorda]}>
                  <View style={s.servicoRank}>
                    <Text style={s.rankNumero}>{i + 1}</Text>
                  </View>
                  <View style={s.servicoInfo}>
                    <Text style={s.servicoNome} numberOfLines={1}>{sv.nome}</Text>
                    <Text style={s.servicoCount}>{sv.concluidos}× concluído</Text>
                  </View>
                  <Text style={s.servicoReceita}>{formatarMoeda(sv.receita)}</Text>
                </View>
              ))}
            </View>
          )}

          {(dados?.topServicos?.length ?? 0) === 0 && !loading && (
            <View style={s.empty}>
              <Ionicons name="bar-chart-outline" size={36} color={Colors.border} />
              <Text style={s.emptyTexto}>Nenhum serviço concluído{'\n'}neste período</Text>
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      {/* Botão exportar */}
      {!loading && (
        <View style={[s.rodape, { paddingBottom: Math.max(insets.bottom, Spacing.base) }]}>
          <TouchableOpacity
            style={s.exportBtn}
            activeOpacity={0.85}
            onPress={() => alert('Em breve', 'A exportação de relatórios estará disponível em breve.')}
          >
            <Text style={s.exportTexto}>Exportar relatório</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centralize: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.base },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBtn:   { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:{ fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.primary, letterSpacing: 1.2 },

  hero:       { paddingVertical: Spacing.xl },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, marginBottom: Spacing.sm },
  chipPos:    { backgroundColor: '#dcfce7' },
  chipNeg:    { backgroundColor: '#fee2e2' },
  chipTexto:  { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, letterSpacing: 0.4 },
  chipTextoPos:{ color: Colors.success },
  chipTextoNeg:{ color: Colors.error },

  totalValor: { fontSize: 38, fontWeight: Typography.weight.extrabold, color: Colors.primary, letterSpacing: -1, marginBottom: Spacing.xs },
  totalSub:   { fontSize: Typography.size.sm, color: Colors.textSecondary },

  card:           { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  graficoHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  graficoLabel:   { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textMuted, letterSpacing: 0.8 },
  tabs:           { flexDirection: 'row', gap: Spacing.xs },
  tab:            { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radii.full, backgroundColor: Colors.background },
  tabAtivo:       { backgroundColor: Colors.accent },
  tabTexto:       { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textMuted },
  tabTextoAtivo:  { color: Colors.surface },

  secaoLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.md },
  servicoRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  servicoRowBorda:{ borderBottomWidth: 1, borderBottomColor: Colors.borderLight ?? Colors.border },
  servicoRank:    { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  rankNumero:     { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textSecondary },
  servicoInfo:    { flex: 1 },
  servicoNome:    { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary },
  servicoCount:   { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  servicoReceita: { fontSize: Typography.size.md, fontWeight: Typography.weight.extrabold, color: Colors.primary },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTexto: { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: Typography.size.sm * 1.7 },

  rodape:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  exportBtn: { flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  exportTexto:{ fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.surface },
})
