export const listRulesPaths = {
  '/rules': {
    get: {
      tags: ['Regras'],
      summary: 'Lista as regras',
      description: 'Paginação de 20 por página, das mais recentes para as mais antigas. Os filtros são opcionais e se combinam.',
      parameters: [
        { name: 'enabled', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, example: 'true' },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['MAX_AMOUNT', 'BLOCKED_MCC'] } },
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      ],
      responses: {
        '200': {
          description: 'Página de regras.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RulePage' },
              example: {
                items: [
                  {
                    id: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
                    name: 'Cassinos e apostas',
                    description: null,
                    type: 'BLOCKED_MCC',
                    params: { mcc: '7995' },
                    enabled: true,
                    createdAt: '2026-11-09T14:02:11.000Z',
                    updatedAt: '2026-11-09T14:02:11.000Z',
                  },
                ],
                page: 1,
                pageSize: 20,
                total: 1,
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/InvalidRequest' },
      },
    },
  },
};
