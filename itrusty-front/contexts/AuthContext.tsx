import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabase'
import { api, setUnauthorizedCallback } from '../services/api'
import { saveSecure, getSecure, deleteSecure } from '../utils/storage'

type User = {
  id: string
  name: string
  role: 'MOTORISTA' | 'OFICINA' | null
}

type AuthContextType = {
  token: string | null
  user: User | null
  loading: boolean
  signIn: (accessToken: string, user: User, refreshToken: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<{ token: string | null; user: User | null }>({
    token: null,
    user: null,
  })
  const [loading, setLoading] = useState(true)
  const isSigningInRef = useRef(false)

  async function signIn(accessToken: string, newUser: User, refreshToken: string) {
    isSigningInRef.current = true
    await Promise.all([
      saveSecure('token', accessToken),
      saveSecure('refreshToken', refreshToken),
      saveSecure('user', JSON.stringify(newUser)),
    ])
    setAuth({ token: accessToken, user: newUser })
    isSigningInRef.current = false
  }

  async function signOut() {
    // Revoga o refreshToken no servidor (best-effort — logout local ocorre independente)
    try {
      const refreshToken = await getSecure('refreshToken')
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Falha silenciosa — o logout local prossegue normalmente
    }

    await Promise.all([
      deleteSecure('token'),
      deleteSecure('refreshToken'),
      deleteSecure('user'),
    ])
    await supabase.auth.signOut()
    setAuth({ token: null, user: null })
  }

  function updateUser(updatedUser: User) {
    setAuth(prev => ({ ...prev, user: updatedUser }))
    saveSecure('user', JSON.stringify(updatedUser))
  }

  useEffect(() => {
    setUnauthorizedCallback(signOut)
  }, [])

  useEffect(() => {
    async function carregarSessao() {
      const [savedToken, savedUser] = await Promise.all([
        getSecure('token'),
        getSecure('user'),
      ])
      if (savedToken && savedUser) {
        try {
          setAuth({ token: savedToken, user: JSON.parse(savedUser) })
        } catch {
          await signOut()
        }
      }
      setLoading(false)
    }
    carregarSessao()
  }, [])

  // Ouve login social via OAuth redirect (web)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (isSigningInRef.current) return
        const savedToken = await getSecure('token')
        if (savedToken) return

        try {
          const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
            '/auth/social',
            { supabaseToken: session.access_token }
          )
          await signIn(res.accessToken, res.user, res.refreshToken)
        } catch {
          // Falha silenciosa — usuário pode tentar fazer login manualmente
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ token: auth.token, user: auth.user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
