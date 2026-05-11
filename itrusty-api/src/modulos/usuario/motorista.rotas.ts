import { FastifyInstance } from 'fastify'
import {
  onboarding,
  home,
  postAgendamento,
  getDetalheOficina,
  getAgendamentos,
  getVeiculos,
} from './motorista.controller'
import { autenticar } from '../../compartilhado/middlewares/autenticar'
import { autorizar } from '../../compartilhado/middlewares/autorizar'

const MOTORISTA = [autenticar, autorizar('MOTORISTA')]

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
            },
          },
        },
      },
    },
  }, onboarding)

  app.get('/home', {
    preHandler: [autenticar, autorizar('MOTORISTA')],
    schema: {
      querystring: {
        additionalProperties: false,
        type: 'object',
        properties: {
          lat:  { type: 'number', minimum: -90,  maximum: 90 },
          lng:  { type: 'number', minimum: -180, maximum: 180 },
          page: { type: 'integer', minimum: 1, default: 1 },
        },
      },
    },
  }, home)
  app.get('/oficinas/:id',  { preHandler: MOTORISTA }, getDetalheOficina)
  app.get('/agendamentos', { preHandler: MOTORISTA }, getAgendamentos)
  app.get('/veiculos',     { preHandler: MOTORISTA }, getVeiculos)

  app.post('/agendamentos', {
      preHandler: MOTORISTA,
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['oficinaId', 'servicoId', 'veiculoId', 'dataServico',
  'horaInicio'],
          properties: {
            oficinaId:   { type: 'string', minLength: 36, maxLength: 36 },
            servicoId:   { type: 'string', minLength: 36, maxLength: 36 },
            veiculoId:   { type: 'string', minLength: 36, maxLength: 36 },
            dataServico: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            horaInicio:  { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$'
  },
            observacao:  { type: 'string', maxLength: 500 },
          },
        },
      },
    }, postAgendamento)
}
