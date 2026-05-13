export interface EsqueciSenhaDTO {
  email: string
}

export interface RedefinirSenhaDTO {
  token: string
  password: string
}

export interface VerificarEmailDTO {
  token: string
}
