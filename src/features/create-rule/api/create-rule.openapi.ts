export const createRulePaths = {
  '/rules': {
    post: {
      tags: ['Regras'],
      summary: 'Cria uma regra de fraude',
      description:
        'Cadastra uma regra configurável. O nome é único sem diferenciar maiúsculas; `enabled` assume `true` quando omitido. Hoje as regras ficam apenas cadastradas e não alteram o score da Function.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NewRule' },
            examples: {
              valorMaximo: {
                summary: 'Valor máximo por transação',
                value: {
                  name: 'Valor máximo por transação',
                  description: 'Sinaliza transações acima de R$ 5.000,00.',
                  type: 'MAX_AMOUNT',
                  params: { limit: 5000 },
                },
              },
              mccBloqueado: {
                summary: 'Categoria bloqueada',
                value: { name: 'Cassinos e apostas', type: 'BLOCKED_MCC', params: { mcc: '7995' }, enabled: false },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Regra criada.',
          headers: { Location: { description: 'Caminho da regra criada.', schema: { type: 'string' } } },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Rule' },
              example: {
                id: '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11',
                name: 'Valor máximo por transação',
                description: 'Sinaliza transações acima de R$ 5.000,00.',
                type: 'MAX_AMOUNT',
                params: { limit: 5000 },
                enabled: true,
                createdAt: '2026-11-09T14:02:11.000Z',
                updatedAt: '2026-11-09T14:02:11.000Z',
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/InvalidRequest' },
        '409': { $ref: '#/components/responses/DuplicateName' },
      },
    },
  },
};
