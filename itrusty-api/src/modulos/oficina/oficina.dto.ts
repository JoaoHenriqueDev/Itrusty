export interface OnboardingOficinaDTO {
  nome:       string
  cnpj?:      string
  telefone?:  string
  categorias: ('MECANICA' | 'ESTETICA' | 'ELETRICA' | 'MOTOR' | 'SUSPENSAO' | 'PNEUS')[]
  cep:        string
  rua:        string
  numero:     string
  bairro:     string
  cidade:     string
  estado:     string
}

export interface CriarServicoDTO {
  nome:           string
  descricao?:     string
  duracaoMinutos: number
  preco:          number
}

export interface AtualizarServicoDTO {
  nome?:           string
  descricao?:      string
  duracaoMinutos?: number
  preco?:          number
  ativo?:          boolean
}

export interface HorarioDTO {
  dia:        string
  aberto:     boolean
  abertura:   string
  fechamento: string
}

export interface AtualizarPerfilDTO {
  nome?:     string
  fotoUrl?:  string
  telefone?: string
  cep?:      string
  rua?:      string
  numero?:   string
  bairro?:   string
  cidade?:   string
  estado?:   string
  horarios?: HorarioDTO[]
}
