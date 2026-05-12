import { useCallback, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { StarRating } from '../../components/ui/StarRating'

type Avaliacao = {
  id:            string
  nota:          number
  comentario:    string | null
  motoristaNome: string
  criadoEm:      string
}
type Distribuicao = { nota: number; quantidade: number }
type Dados = {
  media:        number | null
  total:        number
  distribuicao: Distribuicao[]
  avaliacoes:   Avaliacao[]
}

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 30)  return `${dias} dias atrás`
  const meses = Math.floor(dias / 30)
  return `${meses} ${meses === 1 ? 'mês' : 'meses'} atrás`
}

export default function Avaliacoes() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [dados,   setDados]   = useState<Dados | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    api.get<Dados>('/oficina/avaliacoes')
      .then(setDados)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []))

  const maxQtd = Math.max(...(dados?.distribuicao.map(d => d.quantidade) ?? [1]), 1)

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.navigate('/(oficina)/perfil' as any)} hitSlop={12} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Avaliações</Text>
        <View style={s.headerBtn} />
      </View>

      {loading ? (
        <View style={s.centralize}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Resumo */}
          <View style={s.resumoCard}>
            <View style={s.resumoEsq}>
              <Text style={s.mediaNumero}>{dados?.media?.toFixed(1) ?? '—'}</Text>
              <StarRating nota={Math.round(dados?.media ?? 0)} tamanho={20} />
              <Text style={s.totalTexto}>{dados?.total ?? 0} {dados?.total === 1 ? 'avaliação' : 'avaliações'}</Text>
            </View>
            <View style={s.distribuicao}>
              {[5, 4, 3, 2, 1].map(n => {
                const d = dados?.distribuicao.find(x => x.nota === n)
                const qtd = d?.quantidade ?? 0
                const pct = maxQtd > 0 ? (qtd / maxQtd) * 100 : 0
                return (
                  <View key={n} style={s.barRow}>
                    <Text style={s.barLabel}>{n}</Text>
                    <Ionicons name="star" size={10} color={Colors.accent} />
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.barQtd}>{qtd}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Lista */}
          {dados?.total === 0 && (
            <View style={s.empty}>
              <Ionicons name="star-outline" size={40} color={Colors.border} />
              <Text style={s.emptyTexto}>Nenhuma avaliação ainda.{'\n'}As avaliações aparecem após a conclusão de serviços.</Text>
            </View>
          )}

          {dados?.avaliacoes.map(a => (
            <View key={a.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.avatar}>
                  <Text style={s.avatarLetra}>{a.motoristaNome[0].toUpperCase()}</Text>
                </View>
                <View style={s.cardHeaderInfo}>
                  <Text style={s.motoristaNome}>{a.motoristaNome}</Text>
                  <Text style={s.cardData}>{tempoRelativo(a.criadoEm)}</Text>
                </View>
                <StarRating nota={a.nota} tamanho={14} />
              </View>
              {a.comentario && (
                <Text style={s.comentario}>{a.comentario}</Text>
              )}
            </View>
          ))}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centralize: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBtn:  { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:{ fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  scroll:     { padding: Spacing.lg },

  resumoCard: { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.base, ...Shadows.sm },
  resumoEsq:  { alignItems: 'center', gap: Spacing.xs, minWidth: 80 },
  mediaNumero:{ fontSize: 40, fontWeight: Typography.weight.extrabold, color: Colors.primary, lineHeight: 44 },
  totalTexto: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },

  distribuicao:{ flex: 1, gap: Spacing.xs, justifyContent: 'center' },
  barRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  barLabel:   { fontSize: Typography.size.xs, color: Colors.textSecondary, width: 10, textAlign: 'right' },
  barBg:      { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  barQtd:     { fontSize: Typography.size.xs, color: Colors.textMuted, width: 16, textAlign: 'right' },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTexto: { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: Typography.size.sm * 1.7 },

  card:       { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarLetra:{ fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold, color: Colors.surface },
  cardHeaderInfo:{ flex: 1 },
  motoristaNome:{ fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary },
  cardData:   { fontSize: Typography.size.xs, color: Colors.textMuted },
  comentario: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * 1.6, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm },
})
