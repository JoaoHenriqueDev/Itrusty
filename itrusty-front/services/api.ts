import { getSecure, saveSecure } from '../utils/storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const TIMEOUT_MS = 15_000

let unauthorizedCallback: (() => void) | null = null
export function setUnauthorizedCallback(cb: () => void) {
  unauthorizedCallback = cb
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted) throw new Error('Servidor não respondeu. Verifique sua conexão.')
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// Garante que múltiplas requisições simultâneas com 401 façam apenas um refresh
let pendingRefresh: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getSecure('refreshToken')
  if (!refreshToken) return null

  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null

    const data = await res.json() as { accessToken: string; refreshToken: string }
    await Promise.all([
      saveSecure('token', data.accessToken),
      saveSecure('refreshToken', data.refreshToken),
    ])
    return data.accessToken
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token   = await getSecure('token')
  const hasBody = options.body !== undefined

  const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Tenta renovar token automaticamente em caso de 401 (exceto nas rotas de auth)
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (!pendingRefresh) {
      pendingRefresh = refreshAccessToken().finally(() => { pendingRefresh = null })
    }
    const newToken = await pendingRefresh

    if (!newToken) {
      unauthorizedCallback?.()
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const retry = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    })
    const retryData = await retry.json()
    if (!retry.ok) throw new Error(retryData.error ?? 'Erro desconhecido')
    return retryData as T
  }

  const data = res.status === 204 ? null : await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Erro desconhecido')
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

  delete: <T = void>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
