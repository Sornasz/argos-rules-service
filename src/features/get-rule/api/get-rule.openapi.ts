export const getRulePaths = {
  '/rules/{id}': {
    get: {
      tags: ['Regras'],
      summary: 'Consulta uma regra',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          example: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
        },
      ],
      responses: {
        '200': {
          description: 'A regra.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Rule' },
              example: {
                id: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
                name: 'Cassinos e apostas',
                description: null,
                type: 'BLOCKED_MCC',
                params: { mcc: '7995' },
                enabled: true,
                createdAt: '2026-11-09T14:02:11.000Z',
                updatedAt: '2026-11-09T14:02:11.000Z',
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/InvalidRequest' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
};
