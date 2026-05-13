import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native'
import { Colors, Radii, Spacing, Typography } from '../../constants/theme'

interface InputProps extends TextInputProps {
  label?:      string
  error?:      string
  suffix?:     React.ReactNode
  onSuffixPress?: () => void
}

export function Input({ label, error, suffix, onSuffixPress, style, ...rest }: InputProps) {
  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.container, !!error && s.containerError, style as any]}>
        <TextInput
          style={s.input}
          placeholderTextColor={Colors.textMuted}
          {...rest}
        />
        {suffix ? (
          <TouchableOpacity onPress={onSuffixPress} style={s.suffix} hitSlop={8}>
            {suffix}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrapper:        { marginBottom: Spacing.md },
  label:          { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  container:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, paddingHorizontal: Spacing.base },
  containerError: { borderColor: Colors.error },
  input:          { flex: 1, fontSize: Typography.size.md, color: Colors.text, paddingVertical: Spacing.md },
  suffix:         { paddingLeft: Spacing.sm },
  error:          { fontSize: Typography.size.xs, color: Colors.error, marginTop: Spacing.xs },
})
