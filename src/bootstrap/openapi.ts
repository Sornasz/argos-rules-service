type PathItem = Record<string, unknown>;

const uuid = { type: 'string', format: 'uuid' } as const;
const timestamp = { type: 'string', format: 'date-time' } as const;

const ruleFields = {
  name: { type: 'string', minLength: 3, maxLength: 80, example: 'Valor máximo por transação' },
  description: { type: 'string', nullable: true, maxLength: 500 },
  type: { type: 'string', enum: ['MAX_AMOUNT', 'BLOCKED_MCC'] },
  params: {
    type: 'object',
    description: 'MAX_AMOUNT: `{ "limit": número > 0 }`. BLOCKED_MCC: `{ "mcc": "4 dígitos" }`.',
    example: { limit: 5000 },
  },
};

const schemas = {
  Rule: {
    type: 'object',
    properties: { id: uuid, ...ruleFields, enabled: { type: 'boolean' }, createdAt: timestamp, updatedAt: timestamp },
  },
  NewRule: {
    type: 'object',
    required: ['name', 'type', 'params'],
    properties: { ...ruleFields, enabled: { type: 'boolean', default: true } },
  },
  RuleReplacement: {
    type: 'object',
    required: ['name', 'type', 'params', 'enabled'],
    properties: { ...ruleFields, enabled: { type: 'boolean' } },
  },
  RulePage: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/Rule' } },
      page: { type: 'integer', minimum: 1 },
      pageSize: { type: 'integer', example: 20 },
      total: { type: 'integer' },
    },
  },
  Health: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'unavailable'] },
      store: { type: 'string', enum: ['mongo', 'memory'] },
      reason: { type: 'string' },
    },
  },
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'invalid_request' },
      message: { type: 'string' },
      invalid_fields: {
        type: 'array',
        items: { type: 'object', properties: { field: { type: 'string' }, reason: { type: 'string' } } },
      },
    },
  },
};

const errorContent = (example: unknown) => ({
  'application/json': { schema: { $ref: '#/components/schemas/Error' }, example },
});

const responses = {
  InvalidRequest: {
    description: 'Parâmetro, campo ou corpo inválido.',
    content: errorContent({
      error: 'invalid_request',
      message: 'Campos ausentes ou em formato incorreto.',
      invalid_fields: [{ field: 'params.limit', reason: 'deve ser um número maior que zero' }],
    }),
  },
  NotFound: {
    description: 'Recurso não encontrado.',
    content: errorContent({ error: 'not_found', message: 'Regra não encontrada.' }),
  },
  DuplicateName: {
    description: 'Já existe uma regra com esse nome (sem diferenciar maiúsculas).',
    content: errorContent({ error: 'name_already_exists', message: 'Já existe uma regra com esse nome.' }),
  },
};

function mergePaths(featurePaths: readonly Record<string, unknown>[]): Record<string, PathItem> {
  const merged: Record<string, PathItem> = {};
  for (const paths of featurePaths) {
    for (const [path, item] of Object.entries(paths)) {
      merged[path] = { ...merged[path], ...(item as PathItem) };
    }
  }
  return merged;
}

export function buildOpenApiDocument(featurePaths: readonly Record<string, unknown>[]) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Argos rules-service',
      version: '0.1.0',
      description:
        'Cadastro das regras de fraude configuráveis que o analista gerencia. Atenção: as regras ficam apenas cadastradas e, hoje, não alteram o score calculado pela Function.',
    },
    tags: [{ name: 'Regras', description: 'Create, read, update e delete das regras de fraude.' }, { name: 'Saúde' }],
    paths: mergePaths(featurePaths),
    components: { schemas, responses },
  };
}
