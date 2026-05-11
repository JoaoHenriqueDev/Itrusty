// src/modulos/auth/auth.dto.ts

export interface CadastroDTO {
  name: string
  email: string
  phone?: string
  password: string
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
  role?: 'MOTORISTA' | 'OFICINA' | null
}

export interface SocialLoginDTO {
  supabaseToken: string
}
