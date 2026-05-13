import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography } from '../../constants/theme'

interface EmptyStateProps {
  icon?:       keyof typeof Ionicons.glyphMap
  titulo:      string
  descricao?:  string
  acaoLabel?:  string
  onAcao?:     () => void
}

export function EmptyState({ icon = 'file-tray-outline', titulo, descricao, acaoLabel, onAcao }: EmptyStateProps) {
  return (
    <View style={s.container}>
      <View style={s.iconeContainer}>
        <Ionicons name={icon} size={32} color={Colors.textMuted} />
      </View>
      <Text style={s.titulo}>{titulo}</Text>
      {descricao ? <Text style={s.descricao}>{descricao}</Text> : null}
      {acaoLabel && onAcao ? (
        <TouchableOpacity style={s.botao} onPress={onAcao} activeOpacity={0.7}>
          <Text style={s.botaoTexto}>{acaoLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container:      { alignItems: 'center', paddingVertical: Spacing['4xl'], paddingHorizontal: Spacing['3xl'] },
  iconeContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base },
  titulo:         { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xs },
  descricao:      { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  botao:          { marginTop: Spacing.base, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  botaoTexto:     { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.accent },
})
