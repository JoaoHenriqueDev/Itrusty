// src/modulos/auth/auth.dto.ts

export interface CadastroDTO {
  name: string
  email: string
  phone?: string
  password: string
  role: 'MOTORISTA' | 'OFICINA'
}

export interface LoginDTO {
  email: string
  password: string
}

export interface UsuarioResponseDTO {
  id: string
  name: string
  email: string
  phone?: string
  role: 'MOTORISTA' | 'OFICINA'
}

export interface SocialLoginDTO {
    supabaseToken: string
    role: 'MOTORISTA' | 'OFICINA'
}