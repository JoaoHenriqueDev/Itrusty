import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Radii, Spacing, Typography, Shadows } from '../../constants/theme'

type Provider = 'google' | 'apple'

interface SocialButtonProps {
  provider: Provider
  onPress:  () => void
  loading?: boolean
}

const CONFIG = {
  google: {
    label:    'Continuar com Google',
    bg:       Colors.surface,
    border:   Colors.border,
    textColor:Colors.text,
    iconColor:'#4285F4',
  },
  apple: {
    label:    'Continuar com Apple',
    bg:       Colors.primary,
    border:   Colors.primary,
    textColor:Colors.surface,
    iconColor:Colors.surface,
  },
}

export function SocialButton({ provider, onPress, loading = false }: SocialButtonProps) {
  const cfg = CONFIG[provider]

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={cfg.label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={cfg.textColor} />
      ) : (
        <>
          {provider === 'google' ? (
            <GoogleIcon color={cfg.iconColor} />
          ) : (
            <Ionicons name="logo-apple" size={20} color={cfg.iconColor} />
          )}
          <Text style={[s.label, { color: cfg.textColor }]}>{cfg.label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

// Google "G" com as cores oficiais (4 cores)
function GoogleIcon({ color }: { color: string }) {
  // Usa a letra "G" estilizada como referência visual
  // Para produção, substituir por SVG via react-native-svg
  return (
    <View style={s.googleIconContainer}>
      <View style={[s.googleIconBg, { borderColor: '#E5E7EB' }]}>
        <Text style={s.googleG}>G</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  btn:               { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radii.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, minHeight: 52, ...Shadows.sm },
  label:             { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  googleIconContainer:{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  googleIconBg:      { width: 20, height: 20, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  googleG:           { fontSize: 12, fontWeight: Typography.weight.bold, color: '#4285F4', lineHeight: 14 },
})
