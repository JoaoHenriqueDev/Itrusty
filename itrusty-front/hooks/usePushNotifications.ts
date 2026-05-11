import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { api } from '../services/api'

// Como as notificações aparecem com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
})

async function registrarToken() {
  // Push não funciona em simulador/emulador
  if (!Device.isDevice) return

  // Canal Android (obrigatório para Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:              'iTrusty',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 250, 250, 250],
      lightColor:        '#F97316',
      sound:             'default',
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

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  await api.patch('/usuario/push-token', { token }).catch(() => {})
}

export function usePushNotifications(onTap?: () => void) {
  const notifListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    registrarToken()

    // Notificação recebida com app aberto (exibe automaticamente pelo handler acima)
    notifListener.current = Notifications.addNotificationReceivedListener(() => {})

    // Usuário tocou na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      onTap?.()
    })

    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])
}
