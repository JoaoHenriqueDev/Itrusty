import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import SplashScreen from '../components/SplashScreen'

function RootLayoutNav() {
  const { token, user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()

  useEffect(() => {
    if (!navigationState?.key || loading) return

    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inMotorista  = segments[0] === '(motorista)'
    const inOficina    = segments[0] === '(oficina)'

    if (!token) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    if (!user?.role) {
      if (!inOnboarding) router.replace('/(onboarding)/role')
      return
    }

    if (user.role === 'MOTORISTA' && !inMotorista) {
      router.replace('/(motorista)/')
      return
    }

    if (user.role === 'OFICINA' && !inOficina) {
      router.replace('/(oficina)/')
      return
    }
  }, [token, user, loading, navigationState?.key])

  if (loading || !navigationState?.key) return <SplashScreen />

  return <Slot />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
