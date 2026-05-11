import { useRef, useEffect } from 'react'
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii } from '../constants/theme'

interface NotificacaoBannerProps {
  titulo:    string
  corpo:     string
  onDismiss: () => void
}

export function NotificacaoBanner({ titulo, corpo, onDismiss }: NotificacaoBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-8)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <TouchableOpacity onPress={onDismiss} activeOpacity={0.85}>
      <Animated.View style={[s.container, { opacity, transform: [{ translateY }] }]}>
        <View style={s.iconeContainer}>
          <Ionicons name="notifications" size={16} color={Colors.accent} />
        </View>
        <View style={s.texto}>
          <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
          <Text style={s.corpo} numberOfLines={1}>{corpo}</Text>
        </View>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
      </Animated.View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radii.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  iconeContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,166,35,0.15)', justifyContent: 'center', alignItems: 'center' },
  texto:          { flex: 1 },
  titulo:         { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.surface },
  corpo:          { fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
})
