export const updateRulePaths = {
  '/rules/{id}': {
    put: {
      tags: ['Regras'],
      summary: 'Substitui uma regra',
      description:
        'Substitui `name`, `description`, `type`, `params` e `enabled`; todos são obrigatórios, exceto `description` (ausente vira `null`). `createdAt` é preservado e `updatedAt` é renovado.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          example: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RuleReplacement' },
            example: {
              name: 'Valor máximo por transação',
              description: 'Limite revisado para R$ 3.000,00.',
              type: 'MAX_AMOUNT',
              params: { limit: 3000 },
              enabled: true,
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Regra atualizada.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Rule' },
              example: {
                id: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
                name: 'Valor máximo por transação',
                description: 'Limite revisado para R$ 3.000,00.',
                type: 'MAX_AMOUNT',
                params: { limit: 3000 },
                enabled: true,
                createdAt: '2026-11-09T14:02:11.000Z',
                updatedAt: '2026-11-09T15:30:00.000Z',
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/InvalidRequest' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/DuplicateName' },
      },
    },
  },
};
