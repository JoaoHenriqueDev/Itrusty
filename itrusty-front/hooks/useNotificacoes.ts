import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../services/api'

type Notificacao = {
  id: string
  titulo: string
  corpo: string
  lida: boolean
  criadaEm: string
}

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await api.get<{ notificacoes: Notificacao[] }>('/notificacoes')
      setNotificacoes(res.notificacoes)
    } catch {}
  }, [])

  async function marcarLida(id: string) {
    try {
      await api.patch(`/notificacoes/${id}/lida`, {})
      setNotificacoes(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  useEffect(() => {
    carregar()
    intervalRef.current = setInterval(carregar, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [carregar])

  return { notificacoes, naoLidas: notificacoes.length, marcarLida, recarregar: carregar }
}
