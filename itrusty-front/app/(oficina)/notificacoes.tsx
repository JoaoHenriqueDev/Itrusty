import { useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export default function NotificacoesOficina() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { notificacoes, marcarLida, recarregar } = useNotificacoes()

  useFocusEffect(useCallback(() => { recarregar() }, [recarregar]))

  async function marcarTodas() {
    for (const n of notificacoes) await marcarLida(n.id)
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Notificações</Text>
        {notificacoes.length > 0 ? (
          <TouchableOpacity onPress={marcarTodas} style={s.lerTudoBtn}>
            <Text style={s.lerTudoTexto}>Ler tudo</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {notificacoes.length === 0 ? (
          <View style={s.vazio}>
            <View style={s.vazioIcone}>
              <Ionicons name="notifications-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={s.vazioTitulo}>Tudo em dia</Text>
            <Text style={s.vazioSub}>Nenhuma notificação pendente</Text>
          </View>
        ) : (
          notificacoes.map(n => (
            <TouchableOpacity
              key={n.id}
              style={s.card}
              onPress={() => marcarLida(n.id)}
              activeOpacity={0.7}
            >
              <View style={s.iconeBall}>
                <Ionicons name="notifications" size={16} color={Colors.accent} />
              </View>
              <View style={s.conteudo}>
                <Text style={s.titulo} numberOfLines={1}>{n.titulo}</Text>
                <Text style={s.corpo} numberOfLines={2}>{n.corpo}</Text>
                <Text style={s.tempo}>{tempoRelativo(n.criadaEm)}</Text>
              </View>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  voltarBtn:    { width: 40, height: 40, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitulo: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  lerTudoBtn:   { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  lerTudoTexto: { fontSize: Typography.size.sm, color: Colors.accent, fontWeight: Typography.weight.semibold },
  scroll:       { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'], paddingTop: Spacing.sm },

  vazio:        { alignItems: 'center', paddingTop: Spacing['5xl'] },
  vazioIcone:   { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  vazioTitulo:  { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text, marginBottom: Spacing.xs },
  vazioSub:     { fontSize: Typography.size.sm, color: Colors.textMuted },

  card:         { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  iconeBall:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  conteudo:     { flex: 1 },
  titulo:       { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.text, marginBottom: 2 },
  corpo:        { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xs },
  tempo:        { fontSize: Typography.size.xs, color: Colors.textMuted },
})
