 import { FastifyInstance } from 'fastify'
 import { onboarding, home } from './motorista.controller'
   import { autenticar } from '../../compartilhado/middlewares/autenticar'

  export async function motoristaRotas(app: FastifyInstance) {
    app.post('/onboarding', {
    preHandler: [autenticar],
      schema: {
        body: {
            additionalProperties: false,
          type: 'object',
          required: ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'veiculo'],
          properties: {
            cep:    { type: 'string', minLength: 8,  maxLength: 9 },
            rua:    { type: 'string', minLength: 3,  maxLength: 150 },
            numero: { type: 'string', minLength: 1,  maxLength: 10 },
            bairro: { type: 'string', minLength: 2,  maxLength: 100 },
            cidade: { type: 'string', minLength: 2,  maxLength: 100 },
            estado: { type: 'string', minLength: 2,  maxLength: 2 },
            veiculo: {
                 additionalProperties: false,
              type: 'object',
              required: ['marca', 'modelo', 'ano', 'placa'],
              properties: {
                marca:  { type: 'string', minLength: 1, maxLength: 50 },
                modelo: { type: 'string', minLength: 1, maxLength: 50 },
                ano:    { type: 'number', minimum: 1950, maximum: 2030 },
                placa:  { type: 'string', minLength: 7,  maxLength: 8 },
              }
            }
          }
        }
      }
    }, onboarding)
      app.get('/home', {
    preHandler: [autenticar],
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          lat: { type: 'number', minimum: -90,  maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
        }
      }
    }
  }, home)
  }
  