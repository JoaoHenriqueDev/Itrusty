import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Radii, Spacing } from '../../constants/theme'

interface SkeletonCardProps {
  height?:  number
  width?:   number | string
  radius?:  number
  style?:   ViewStyle
}

export function SkeletonCard({ height = 80, width = '100%', radius = Radii.md, style }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[s.skeleton, { height, width: width as any, borderRadius: radius, opacity }, style]}
    />
  )
}

export function SkeletonRow() {
  return (
    <View style={s.row}>
      <SkeletonCard height={56} width={56} radius={Radii.md} />
      <View style={s.rowInfo}>
        <SkeletonCard height={14} width="60%" radius={Radii.xs} style={{ marginBottom: Spacing.xs }} />
        <SkeletonCard height={12} width="40%" radius={Radii.xs} />
      </View>
    </View>
  )
}

export function SkeletonMetrics() {
  return (
    <View style={s.metricsRow}>
      <SkeletonCard height={88} style={{ flex: 1.4 }} radius={Radii.lg} />
      <SkeletonCard height={88} style={{ flex: 0.8 }}  radius={Radii.lg} />
    </View>
  )
}

const s = StyleSheet.create({
  skeleton:   { backgroundColor: Colors.border },
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowInfo:    { flex: 1 },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
})
