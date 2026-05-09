 import { FastifyInstance } from 'fastify'
  import { onboarding } from './oficina.controller'
   import { autenticar } from '../../compartilhado/middlewares/autenticar'

  export async function oficinaRotas(app: FastifyInstance) {
    app.post('/onboarding', {
    preHandler: [autenticar],
      schema: {
        body: {
            additionalProperties: false,
          type: 'object',
          required: ['nome', 'categorias', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'],
          properties: {
            nome:      { type: 'string', minLength: 2,  maxLength: 100 },
            cnpj:      { type: 'string', minLength: 14, maxLength: 18, pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$'},
            telefone:  { type: 'string', minLength: 10, maxLength: 15 },
            categorias: { type: 'array', items: { type: 'string', enum:
  ['MECANICA','ESTETICA','ELETRICA','MOTOR','SUSPENSAO','PNEUS'] }, minItems: 1 },
            cep:       { type: 'string', minLength: 8,  maxLength: 9 },
            rua:       { type: 'string', minLength: 3,  maxLength: 150 },
            numero:    { type: 'string', minLength: 1,  maxLength: 10 },
            bairro:    { type: 'string', minLength: 2,  maxLength: 100 },
            cidade:    { type: 'string', minLength: 2,  maxLength: 100 },
            estado:    { type: 'string', minLength: 2,  maxLength: 2 },
          }
        }
      }
    }, onboarding)
  }
