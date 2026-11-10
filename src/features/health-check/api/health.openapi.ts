export const healthPaths = {
  '/health': {
    get: {
      tags: ['Saúde'],
      summary: 'Estado do serviço',
      description: 'Responde 200 quando o banco responde e 503 quando não.',
      responses: {
        '200': {
          description: 'Saudável.',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Health' }, example: { status: 'ok', store: 'mongo' } },
          },
        },
        '503': {
          description: 'Banco indisponível.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Health' },
              example: { status: 'unavailable', store: 'mongo', reason: 'MongoServerSelectionError' },
            },
          },
        },
      },
    },
  },
};
