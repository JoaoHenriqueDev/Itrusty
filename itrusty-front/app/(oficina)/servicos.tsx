import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { AppHeader } from '../../components/ui/AppHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonCard'
import { useOficina } from '../../hooks/useOficina'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { NotificacaoBanner } from '../../components/NotificacaoBanner'

type Servico = {
  id:             string
  nome:           string
  descricao:      string | null
  duracaoMinutos: number
  preco:          number
  ativo:          boolean
}

function formatarDuracao(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

export default function ServicosOficina() {
  const { user }    = useAuth()
  const router      = useRouter()
  const insets      = useSafeAreaInsets()
  const { oficina } = useOficina()
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes()

  const [servicos,  setServicos]  = useState<Servico[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await api.get<{ servicos: Servico[] }>('/oficina/servicos')
      setServicos(res.servicos)
    } catch {} finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { carregar() }, [carregar]))

  async function toggleAtivo(sv: Servico) {
    if (toggling) return
    setToggling(sv.id)
    const novoAtivo = !sv.ativo
    setServicos(prev => prev.map(x => x.id === sv.id ? { ...x, ativo: novoAtivo } : x))
    try {
      await api.patch(`/oficina/servicos/${sv.id}`, { ativo: novoAtivo })
    } catch {
      setServicos(prev => prev.map(x => x.id === sv.id ? { ...x, ativo: sv.ativo } : x))
    } finally {
      setToggling(null)
    }
  }

  const ativos = servicos.filter(s => s.ativo).length
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

      <View style={s.tituloRow}>
        <View>
          <Text style={s.titulo}>Serviços</Text>
          {!loading && (
            <Text style={s.subtitulo}>
              {servicos.length} SERVIÇOS · {ativos} ATIVOS
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/(oficina)/servico/novo' as any)}
          accessibilityLabel="Adicionar serviço"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.skeletonContainer}>
          {[0,1,2].map(i => (
            <SkeletonCard key={i} height={72} radius={Radii.md} style={{ marginBottom: Spacing.sm }} />
          ))}
        </View>
      ) : servicos.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          titulo="Nenhum serviço cadastrado"
          descricao="Adicione os serviços que sua oficina oferece."
          acaoLabel="Adicionar serviço"
          onAcao={() => router.push('/(oficina)/servico/novo' as any)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.lista}>
          {servicos.map(sv => (
            <View key={sv.id} style={[s.card, !sv.ativo && s.cardInativo]}>
              <TouchableOpacity
                style={s.cardInfo}
                onPress={() => router.push(`/(oficina)/servico/${sv.id}` as any)}
                activeOpacity={0.65}
              >
                <Text style={[s.servicoNome, !sv.ativo && s.textoInativo]}>{sv.nome}</Text>
                <Text style={s.servicoInfo}>
                  {formatarDuracao(sv.duracaoMinutos)} · R$ {sv.preco.toFixed(2).replace('.', ',')}
                </Text>
              </TouchableOpacity>
              <Switch
                value={sv.ativo}
                onValueChange={() => toggleAtivo(sv)}
                disabled={toggling === sv.id}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor={Colors.surface}
                ios_backgroundColor={Colors.border}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  tituloRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.base },
  titulo:          { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary },
  subtitulo:       { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 0.8, marginTop: Spacing.xs },
  addBtn:          { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  skeletonContainer:{ paddingHorizontal: Spacing.lg },
  lista:           { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.md, paddingRight: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardInativo:     { opacity: 0.65 },
  cardInfo:        { flex: 1, padding: Spacing.base },
  servicoNome:     { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, marginBottom: Spacing.xs },
  textoInativo:    { color: Colors.textMuted },
  servicoInfo:     { fontSize: Typography.size.sm, color: Colors.textSecondary },
})
