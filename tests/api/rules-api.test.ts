import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/bootstrap/server.js';
import { createCreateRuleFeature } from '../../src/features/create-rule/index.js';
import { createDeleteRuleFeature } from '../../src/features/delete-rule/index.js';
import { createGetRuleFeature } from '../../src/features/get-rule/index.js';
import { createHealthCheckFeature } from '../../src/features/health-check/index.js';
import { createListRulesFeature } from '../../src/features/list-rules/index.js';
import { createUpdateRuleFeature } from '../../src/features/update-rule/index.js';
import { MemoryRulesStore, type FeatureHttp, type Persistence } from '../../src/shared/index.js';

const missing = '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11';
const maxAmount = { name: 'Valor máximo', description: 'Acima de R$ 5.000,00', type: 'MAX_AMOUNT', params: { limit: 5000 } };
const blockedMcc = { name: 'Apostas', type: 'BLOCKED_MCC', params: { mcc: '7995' }, enabled: false };

let server: Server;
let baseUrl: string;
let store: MemoryRulesStore;
let logged: string[];

function featuresFor(persistence: Persistence): FeatureHttp[] {
  return [
    createListRulesFeature({ persistence }),
    createGetRuleFeature({ persistence }),
    createCreateRuleFeature({ persistence }),
    createUpdateRuleFeature({ persistence }),
    createDeleteRuleFeature({ persistence }),
    createHealthCheckFeature({ persistence }),
  ];
}

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, text, headers: response.headers };
}

beforeAll(async () => {
  store = new MemoryRulesStore();
  logged = [];
  const app = createApp({ features: featuresFor({ kind: 'memory', store }), log: (line) => logged.push(line) });
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
  store.rules.clear();
});

describe('POST /rules', () => {
  it('cria com 201, Location e enabled=true por padrão', async () => {
    const { status, json, headers } = await call('POST', '/rules', maxAmount);

    expect(status).toBe(201);
    expect(headers.get('location')).toBe(`/rules/${json.id}`);
    expect(json).toMatchObject({ ...maxAmount, enabled: true });
    expect(json.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isNaN(Date.parse(json.createdAt))).toBe(false);
    expect(json.updatedAt).toBe(json.createdAt);
  });

  it('respeita enabled=false e description ausente vira null', async () => {
    const { json } = await call('POST', '/rules', blockedMcc);

    expect(json).toMatchObject({ enabled: false, description: null });
  });

  it('409 para nome repetido sem diferenciar maiúsculas', async () => {
    await call('POST', '/rules', maxAmount);
    const { status, json } = await call('POST', '/rules', { ...maxAmount, name: 'VALOR MÁXIMO' });

    expect(status).toBe(409);
    expect(json.error).toBe('name_already_exists');
  });

  it('400 com invalid_fields', async () => {
    const { status, json } = await call('POST', '/rules', { name: 'ab', type: 'MAX_AMOUNT', params: { limit: -1 } });

    expect(status).toBe(400);
    expect(json.error).toBe('invalid_request');
    expect(json.invalid_fields.map((f: { field: string }) => f.field)).toEqual(['name', 'params.limit']);
  });

  it('400 para JSON inválido', async () => {
    const { status, json } = await call('POST', '/rules', '{nome:');

    expect(status).toBe(400);
    expect(json.error).toBe('invalid_json');
  });

  it('413 para corpo grande', async () => {
    const { status, json } = await call('POST', '/rules', { ...maxAmount, description: 'x'.repeat(200_000) });

    expect(status).toBe(413);
    expect(json.error).toBe('payload_too_large');
  });
});

describe('GET /rules/:id', () => {
  it('200 com a regra', async () => {
    const created = (await call('POST', '/rules', maxAmount)).json;
    const { status, json } = await call('GET', `/rules/${created.id}`);

    expect(status).toBe(200);
    expect(json).toEqual(created);
  });

  it('404 quando não existe', async () => {
    const { status, json } = await call('GET', `/rules/${missing}`);

    expect(status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('400 quando o id não é UUID', async () => {
    const { status, json } = await call('GET', '/rules/abc');

    expect(status).toBe(400);
    expect(json.invalid_fields).toEqual([{ field: 'id', reason: 'deve ser um UUID' }]);
  });
});

describe('GET /rules', () => {
  async function seed() {
    await call('POST', '/rules', { name: 'Regra A', type: 'MAX_AMOUNT', params: { limit: 1 } });
    await call('POST', '/rules', { name: 'Regra B', type: 'BLOCKED_MCC', params: { mcc: '1111' }, enabled: false });
    await call('POST', '/rules', { name: 'Regra C', type: 'BLOCKED_MCC', params: { mcc: '2222' } });
  }

  it('lista com paginação e mais recentes primeiro', async () => {
    await seed();
    const { status, json } = await call('GET', '/rules');

    expect(status).toBe(200);
    expect(json).toMatchObject({ page: 1, pageSize: 20, total: 3 });
    expect(json.items.map((rule: { name: string }) => rule.name)).toEqual(['Regra C', 'Regra B', 'Regra A']);
  });

  it('filtra por enabled, por type e pelos dois', async () => {
    await seed();

    expect((await call('GET', '/rules?enabled=true')).json.total).toBe(2);
    expect((await call('GET', '/rules?enabled=false')).json.items[0].name).toBe('Regra B');
    expect((await call('GET', '/rules?type=BLOCKED_MCC')).json.total).toBe(2);
    expect((await call('GET', '/rules?type=BLOCKED_MCC&enabled=true')).json.items[0].name).toBe('Regra C');
  });

  it('página 2 vazia devolve o total', async () => {
    await seed();
    const { json } = await call('GET', '/rules?page=2');

    expect(json).toEqual({ items: [], page: 2, pageSize: 20, total: 3 });
  });

  it.each(['page=0', 'page=x', 'enabled=talvez', 'type=OUTRO'])('400 para %s', async (query) => {
    const { status, json } = await call('GET', `/rules?${query}`);

    expect(status).toBe(400);
    expect(json.error).toBe('invalid_request');
  });
});

describe('PUT /rules/:id', () => {
  const replacement = { name: 'Novo nome', type: 'BLOCKED_MCC', params: { mcc: '5411' }, enabled: false };

  it('200 substitui tudo, preserva createdAt e zera description ausente', async () => {
    const created = (await call('POST', '/rules', maxAmount)).json;
    const { status, json } = await call('PUT', `/rules/${created.id}`, replacement);

    expect(status).toBe(200);
    expect(json).toMatchObject({ ...replacement, id: created.id, description: null, createdAt: created.createdAt });
    expect((await call('GET', `/rules/${created.id}`)).json).toEqual(json);
  });

  it('400 quando falta enabled', async () => {
    const created = (await call('POST', '/rules', maxAmount)).json;
    const { enabled: _enabled, ...withoutEnabled } = replacement;
    const { status, json } = await call('PUT', `/rules/${created.id}`, withoutEnabled);

    expect(status).toBe(400);
    expect(json.invalid_fields).toEqual([{ field: 'enabled', reason: 'deve ser true ou false' }]);
  });

  it('400 para id que não é UUID', async () => {
    expect((await call('PUT', '/rules/xyz', replacement)).status).toBe(400);
  });

  it('404 para id inexistente', async () => {
    expect((await call('PUT', `/rules/${missing}`, replacement)).status).toBe(404);
  });

  it('409 ao usar o nome de outra regra, 200 ao manter o próprio', async () => {
    const first = (await call('POST', '/rules', maxAmount)).json;
    await call('POST', '/rules', blockedMcc);

    expect((await call('PUT', `/rules/${first.id}`, { ...replacement, name: 'apostas' })).status).toBe(409);
    expect((await call('PUT', `/rules/${first.id}`, { ...replacement, name: 'VALOR MÁXIMO' })).status).toBe(200);
  });
});

describe('DELETE /rules/:id', () => {
  it('204 e depois 404', async () => {
    const created = (await call('POST', '/rules', maxAmount)).json;
    const first = await call('DELETE', `/rules/${created.id}`);

    expect(first.status).toBe(204);
    expect(first.text).toBe('');
    expect((await call('GET', `/rules/${created.id}`)).status).toBe(404);
    expect((await call('DELETE', `/rules/${created.id}`)).status).toBe(404);
  });

  it('400 para id que não é UUID', async () => {
    expect((await call('DELETE', '/rules/1')).status).toBe(400);
  });
});

describe('GET /health', () => {
  it('200 com store memory', async () => {
    expect(await call('GET', '/health')).toMatchObject({ status: 200, json: { status: 'ok', store: 'memory' } });
  });
});

describe('documentação e erros gerais', () => {
  it('serve o OpenAPI com todas as rotas e exemplos', async () => {
    const { status, json } = await call('GET', '/docs/openapi.json');

    expect(status).toBe(200);
    expect(Object.keys(json.paths).sort()).toEqual(['/health', '/rules', '/rules/{id}']);
    expect(Object.keys(json.paths['/rules'])).toEqual(expect.arrayContaining(['get', 'post']));
    expect(Object.keys(json.paths['/rules/{id}'])).toEqual(expect.arrayContaining(['get', 'put', 'delete']));
    expect(json.paths['/rules'].post.requestBody.content['application/json'].examples).toBeDefined();
  });

  it('serve a Swagger UI em /docs/', async () => {
    const response = await fetch(`${baseUrl}/docs/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('swagger');
  });

  it('404 para rota desconhecida', async () => {
    expect((await call('GET', '/nada')).status).toBe(404);
  });
});

describe('falha do banco', () => {
  async function appWithBrokenStore() {
    const broken = (): Promise<never> => Promise.reject(Object.assign(new Error('mongodb://u:segredo@h'), { name: 'MongoNetworkError' }));
    const lines: string[] = [];
    const app = createApp({ features: featuresFor({ kind: 'mongo', collection: broken }), log: (line) => lines.push(line) });
    const instance = await new Promise<Server>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    return { instance, lines, url: `http://127.0.0.1:${(instance.address() as AddressInfo).port}` };
  }

  it('/health responde 503 e as rotas respondem 500 sem vazar detalhes', async () => {
    const { instance, lines, url } = await appWithBrokenStore();
    try {
      const health = await fetch(`${url}/health`);
      expect(health.status).toBe(503);
      expect(await health.json()).toEqual({ status: 'unavailable', store: 'mongo', reason: 'MongoNetworkError' });

      const list = await fetch(`${url}/rules`);
      const text = await list.text();
      expect(list.status).toBe(500);
      expect(JSON.parse(text)).toEqual({ error: 'internal_error', message: 'Erro interno ao processar a requisição.' });
      expect(text).not.toContain('segredo');
      expect(lines.length).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve) => instance.close(() => resolve()));
    }
  });
});
