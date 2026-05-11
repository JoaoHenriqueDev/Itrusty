import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography } from '../../constants/theme'

interface AppHeaderProps {
  titulo:     string
  subtitulo?: string
  naoLidas?:  number
  onSinoPress?: () => void
}

export function AppHeader({ titulo, subtitulo, naoLidas = 0, onSinoPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const handleSino = onSinoPress ?? (() => router.push('/(oficina)/notificacoes' as any))

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={s.texto}>
        <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
        {subtitulo ? (
          <View style={s.subtituloRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.subtitulo} numberOfLines={1}>{subtitulo}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={s.sinoBotao}
        onPress={handleSino}
        accessibilityLabel="Notificações"
        accessibilityRole="button"
      >
        <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
        {naoLidas > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTexto}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  texto:        { flex: 1, marginRight: Spacing.md },
  titulo:       { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  subtituloRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  subtitulo:    { fontSize: Typography.size.xs, color: Colors.textMuted },
  sinoBotao:    { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  badge:        { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.surface },
  badgeTexto:   { fontSize: 9, fontWeight: Typography.weight.bold, color: Colors.surface },
})
