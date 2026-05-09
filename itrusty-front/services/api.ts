import { getSecure } from '../utils/storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// Registrado pelo AuthContext para forçar logout quando o token expira (401)
let unauthorizedCallback: (() => void) | null = null
export function setUnauthorizedCallback(cb: () => void) {
  unauthorizedCallback = cb
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getSecure('token')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()

  if (res.status === 401) {
    if (token) {
      // Token expirado ou inválido — desloga automaticamente
      unauthorizedCallback?.()
    }
    throw new Error(data.error ?? 'Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'Erro desconhecido')
  }

  return data as T
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string, params?: Record<string, string | number>) => {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : ''
    return request<T>(`${path}${query}`)
  },

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
