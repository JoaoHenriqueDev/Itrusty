import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform, AppState, AppStateStatus } from 'react-native'
import { api } from '../services/api'
import { getSecure, saveSecure } from '../utils/storage'
import { useAuth } from '../contexts/AuthContext'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
})

async function registrarToken(_jwtToken: string) {
  if (!Device.isDevice) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'iTrusty',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#F97316',
      sound:            'default',
    })
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync()
  let statusFinal = statusAtual

  if (statusAtual !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    statusFinal = status
  }

  if (statusFinal !== 'granted') return

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  if (!projectId) return

  const { data: novoToken } = await Notifications.getExpoPushTokenAsync({ projectId })

  // Só envia ao backend se o token mudou localmente
  const tokenSalvo = await getSecure('pushToken')
  if (novoToken === tokenSalvo) return

  try {
    await api.patch('/usuario/push-token', { token: novoToken })
    // Só marca como salvo se o backend confirmou — garante reenvio em caso de falha
    await saveSecure('pushToken', novoToken)
  } catch {
    // Não persiste localmente: próxima abertura do app tentará novamente
  }
}

export function usePushNotifications(onTap?: () => void) {
  const { token: jwtToken } = useAuth()

  const onTapRef = useRef(onTap)
  const notifListener    = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    onTapRef.current = onTap
  }, [onTap])

  // Registra ao fazer login (jwtToken muda de null → valor)
  useEffect(() => {
    if (jwtToken) registrarToken(jwtToken)
  }, [jwtToken])

  // Re-registra quando o app volta ao foreground — recupera token perdido no backend
  useEffect(() => {
    if (!jwtToken) return
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') registrarToken(jwtToken)
    })
    return () => sub.remove()
  }, [jwtToken])

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {})

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      onTapRef.current?.()
    })

    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])
}
