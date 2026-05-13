import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Colors, Radii, Spacing, Typography, Shadows } from '../../constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label:     string
  onPress:   () => void
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  disabled?: boolean
  icon?:     React.ReactNode
  style?:    ViewStyle
}

export function Button({
  label, onPress, variant = 'primary', size = 'lg',
  loading = false, disabled = false, icon, style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[s.base, s[variant], s[`size_${size}`], isDisabled && s.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'primary' ? Colors.surface : Colors.primary} />
        : <>
            {icon}
            <Text style={[s.label, s[`label_${variant}`], s[`labelSize_${size}`]]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  base:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radii.full },
  disabled:       { opacity: 0.5 },

  // variants
  primary:        { backgroundColor: Colors.accent, ...Shadows.sm },
  secondary:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  ghost:          { backgroundColor: 'transparent' },
  danger:         { backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error },

  // sizes
  size_sm:        { paddingVertical: Spacing.sm,  paddingHorizontal: Spacing.base },
  size_md:        { paddingVertical: Spacing.md,  paddingHorizontal: Spacing.xl },
  size_lg:        { paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing.xl },

  // label base
  label:          { fontWeight: Typography.weight.bold },
  label_primary:  { color: Colors.surface },
  label_secondary:{ color: Colors.text },
  label_ghost:    { color: Colors.primary },
  label_danger:   { color: Colors.error },

  labelSize_sm:   { fontSize: Typography.size.sm },
  labelSize_md:   { fontSize: Typography.size.md },
  labelSize_lg:   { fontSize: Typography.size.base },
})
