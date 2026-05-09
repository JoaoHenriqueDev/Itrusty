 export interface OnboardingOficinaDTO {
    nome: string
    cnpj?: string
    telefone?: string
    categorias: ('MECANICA' | 'ESTETICA' | 'ELETRICA' | 'MOTOR' | 'SUSPENSAO' | 'PNEUS')[]
    cep: string
    rua: string
    numero: string
    bairro: string
    cidade: string
    estado: string
  }