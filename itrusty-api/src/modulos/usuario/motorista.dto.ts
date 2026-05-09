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
