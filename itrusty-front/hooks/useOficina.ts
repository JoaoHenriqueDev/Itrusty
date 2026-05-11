import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'

export type OficinaInfo = {
  nome: string
  cidade: string | null
  estado: string | null
  rua: string | null
  numero: string | null
  bairro: string | null
  horarios: { dia: string; abertura: string; fechamento: string; aberto: boolean }[]
}

let _cache: OficinaInfo | null = null

export function invalidarCacheOficina() {
  _cache = null
}

export function useOficina() {
  const [oficina, setOficina] = useState<OficinaInfo | null>(_cache)

  const carregar = useCallback(async (force = false) => {
    if (_cache && !force) { setOficina(_cache); return }
    try {
      const res = await api.get<OficinaInfo>('/oficina/perfil')
      _cache = res
      setOficina(res)
    } catch {}
  }, [])

  useEffect(() => { carregar() }, [carregar])

  return { oficina, recarregar: () => carregar(true) }
}
