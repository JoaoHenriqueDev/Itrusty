import { View, ActivityIndicator } from 'react-native'
import { Colors } from '../constants/colors'

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  )
}
