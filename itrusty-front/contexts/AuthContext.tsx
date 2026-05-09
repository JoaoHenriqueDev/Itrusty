import React, { createContext, useContext, useEffect, useState } from 'react'
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
  signIn: (token: string, user: User) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser]   = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function signIn(newToken: string, newUser: User) {
    await Promise.all([
      saveSecure('token', newToken),
      saveSecure('user', JSON.stringify(newUser)),
    ])
    setToken(newToken)
    setUser(newUser)
  }

  async function signOut() {
    await Promise.all([
      deleteSecure('token'),
      deleteSecure('user'),
    ])
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
  }

  function updateUser(updatedUser: User) {
    setUser(updatedUser)
    saveSecure('user', JSON.stringify(updatedUser))
  }

  // Registra o signOut para ser chamado automaticamente quando o token expirar
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
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
      setLoading(false)
    }
    carregarSessao()
  }, [])

  // Ouve o login social via OAuth (redirect no web)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const savedToken = await getSecure('token')
        if (savedToken) return

        try {
          const res = await api.post<{ token: string; user: User }>('/auth/social', {
            supabaseToken: session.access_token
          })
          await signIn(res.token, res.user)
        } catch {}
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
