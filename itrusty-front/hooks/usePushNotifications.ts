import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
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

async function registrarToken() {
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

  // Não envia se não há sessão ativa
  const jwtToken = await getSecure('token')
  if (!jwtToken) return

  const { data: novoToken } = await Notifications.getExpoPushTokenAsync({ projectId })

  // Só envia ao backend se o token mudou
  const tokenSalvo = await getSecure('pushToken')
  if (novoToken === tokenSalvo) return

  await api.patch('/usuario/push-token', { token: novoToken }).catch(() => {})
  await saveSecure('pushToken', novoToken)
}

export function usePushNotifications(onTap?: () => void) {
  const { token: jwtToken } = useAuth()

  // Ref garante que o callback sempre usa a versão mais recente (sem closure stale)
  const onTapRef = useRef(onTap)
  const notifListener    = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    onTapRef.current = onTap
  }, [onTap])

  // Re-registra o token sempre que o usuário faz login (jwtToken muda de null → valor)
  useEffect(() => {
    if (jwtToken) registrarToken()
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
