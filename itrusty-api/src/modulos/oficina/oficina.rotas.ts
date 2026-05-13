import { FastifyInstance } from 'fastify'
import {
  onboarding,
  getPerfil,
  patchPerfil,
  home,
  agenda,
  detalhe,
  aceitar,
  recusar,
  finalizar,
  getServicos,
  postServico,
  patchServico,
  deleteServico,
} from './oficina.controller'
import { autenticar } from '../../compartilhado/middlewares/autenticar'
import { autorizar } from '../../compartilhado/middlewares/autorizar'

const OFICINA = [autenticar, autorizar('OFICINA')]

export async function oficinaRotas(app: FastifyInstance) {
  // ─── onboarding ──────────────────────────────────────────────────────────
  app.post(
    '/onboarding',
    {
      preHandler: [autenticar],
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['nome', 'categorias', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'],
          properties: {
            nome: { type: 'string', minLength: 2, maxLength: 100 },
            cnpj: { type: 'string', minLength: 14, maxLength: 14, pattern: '^\\d{14}$' },
            telefone: { type: 'string', minLength: 10, maxLength: 11 },
            categorias: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['MECANICA', 'ESTETICA', 'ELETRICA', 'MOTOR', 'SUSPENSAO', 'PNEUS'],
              },
              minItems: 1,
              maxItems: 6,
            },
            cep: { type: 'string', minLength: 8, maxLength: 9 },
            rua: { type: 'string', minLength: 3, maxLength: 150 },
            numero: { type: 'string', minLength: 1, maxLength: 10 },
            bairro: { type: 'string', minLength: 2, maxLength: 100 },
            cidade: { type: 'string', minLength: 2, maxLength: 100 },
            estado: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    onboarding
  )

  // ─── perfil ──────────────────────────────────────────────────────────────
  app.get('/perfil', { preHandler: OFICINA }, getPerfil)
  app.patch(
    '/perfil',
    {
      preHandler: OFICINA,
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          properties: {
            nome: { type: 'string', minLength: 2, maxLength: 100 },
            fotoUrl: { type: 'string', format: 'uri', maxLength: 1000 },
            telefone: { type: 'string', minLength: 10, maxLength: 11 },
            cep: { type: 'string', minLength: 8, maxLength: 9 },
            rua: { type: 'string', minLength: 3, maxLength: 150 },
            numero: { type: 'string', minLength: 1, maxLength: 10 },
            bairro: { type: 'string', minLength: 2, maxLength: 100 },
            cidade: { type: 'string', minLength: 2, maxLength: 100 },
            estado: { type: 'string', minLength: 2, maxLength: 2 },
            horarios: {
              type: 'array',
              items: {
                additionalProperties: false,
                type: 'object',
                required: ['dia', 'aberto', 'abertura', 'fechamento'],
                properties: {
                  dia: { type: 'string', enum: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] },
                  aberto: { type: 'boolean' },
                  abertura: { type: 'string', maxLength: 5 },
                  fechamento: { type: 'string', maxLength: 5 },
                },
              },
            },
          },
        },
      },
    },
    patchPerfil
  )

  // ─── dashboard ───────────────────────────────────────────────────────────
  app.get('/home', { preHandler: OFICINA }, home)

  // ─── agenda ──────────────────────────────────────────────────────────────
  app.get(
    '/agenda',
    {
      preHandler: OFICINA,
      schema: {
        querystring: {
          additionalProperties: false,
          type: 'object',
          properties: { data: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
        },
      },
    },
    agenda
  )

  app.get('/agendamentos/:id', { preHandler: OFICINA }, detalhe)
  app.patch('/agendamentos/:id/aceitar', { preHandler: OFICINA }, aceitar)
  app.patch('/agendamentos/:id/recusar', { preHandler: OFICINA }, recusar)
  app.patch('/agendamentos/:id/finalizar', { preHandler: OFICINA }, finalizar)

  // ─── serviços ────────────────────────────────────────────────────────────
  app.get('/servicos', { preHandler: OFICINA }, getServicos)

  app.post(
    '/servicos',
    {
      preHandler: OFICINA,
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          required: ['nome', 'duracaoMinutos', 'preco'],
          properties: {
            nome: { type: 'string', minLength: 2, maxLength: 100 },
            descricao: { type: 'string', maxLength: 500 },
            duracaoMinutos: { type: 'integer', minimum: 5, maximum: 480 },
            preco: { type: 'number', minimum: 0, multipleOf: 0.01 },
          },
        },
      },
    },
    postServico
  )

  app.patch(
    '/servicos/:id',
    {
      preHandler: OFICINA,
      schema: {
        body: {
          additionalProperties: false,
          type: 'object',
          properties: {
            nome: { type: 'string', minLength: 2, maxLength: 100 },
            descricao: { type: 'string', maxLength: 500 },
            duracaoMinutos: { type: 'integer', minimum: 5, maximum: 480 },
            preco: { type: 'number', minimum: 0, multipleOf: 0.01 },
            ativo: { type: 'boolean' },
          },
        },
      },
    },
    patchServico
  )

  app.delete('/servicos/:id', { preHandler: OFICINA }, deleteServico)
}
