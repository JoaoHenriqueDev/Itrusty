  export interface OnboardingMotoristaDTO {
    cep: string
    rua: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    veiculo: {
      marca: string
      modelo: string
      ano: number
      placa: string
    }
  }

  export interface CriarAgendamentoDTO {
    oficinaId: string
    servicoId: string
    veiculoId: string
    dataServico: string  // YYYY-MM-DD
    horaInicio: string   // HH:MM
    observacao?: string
  }
