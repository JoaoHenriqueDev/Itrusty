import { View, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function SplashScreen() {
  return (
    <LinearGradient colors={['#0A2540', '#1D456E']} style={s.container}>
      <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo:      { width: 140, height: 100 },
})
