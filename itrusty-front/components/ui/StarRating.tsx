import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/theme'

type Props = {
  nota:      number
  onChange?: (n: number) => void
  tamanho?:  number
  cor?:      string
}

export function StarRating({ nota, onChange, tamanho = 16, cor = Colors.accent }: Props) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange?.(n)}
          disabled={!onChange}
          hitSlop={6}
          activeOpacity={0.7}
        >
          <Ionicons
            name={n <= nota ? 'star' : 'star-outline'}
            size={tamanho}
            color={n <= nota ? cor : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3 },
})
