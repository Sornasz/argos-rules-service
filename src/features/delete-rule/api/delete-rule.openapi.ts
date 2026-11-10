export const deleteRulePaths = {
  '/rules/{id}': {
    delete: {
      tags: ['Regras'],
      summary: 'Exclui uma regra',
      description: 'A exclusão é definitiva. Para apenas desativar a regra, use o PUT com `enabled: false`.',
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
        '204': { description: 'Regra excluída.' },
        '400': { $ref: '#/components/responses/InvalidRequest' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
};
