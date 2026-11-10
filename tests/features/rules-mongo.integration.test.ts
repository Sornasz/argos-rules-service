import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoRuleCreator } from '../../src/features/create-rule/infrastructure/mongo-rule-creator.js';
import { MongoRuleRemover } from '../../src/features/delete-rule/infrastructure/mongo-rule-remover.js';
import { MongoRuleFinder } from '../../src/features/get-rule/infrastructure/mongo-rule-finder.js';
import { MongoStoreProbe } from '../../src/features/health-check/infrastructure/mongo-store-probe.js';
import { MongoRuleSearch } from '../../src/features/list-rules/infrastructure/mongo-rule-search.js';
import { MongoRuleUpdater } from '../../src/features/update-rule/infrastructure/mongo-rule-updater.js';
import { RULES_COLLECTION, ensureIndexes } from '../../src/shared/mongo-connection.js';
import type { RuleDocument } from '../../src/shared/rule-document.js';

const uri = process.env.MONGO_TEST_URI;
const newRule = { name: 'Valor máximo', description: null, type: 'MAX_AMOUNT' as const, params: { limit: 100 }, enabled: true };

describe.skipIf(!uri)('adapters do MongoDB (integração, MONGO_TEST_URI)', () => {
  const database = `argos_rules_test_${randomUUID().slice(0, 8)}`;
  let client: MongoClient;
  const collection = async () => client.db(database).collection<RuleDocument>(RULES_COLLECTION);

  beforeAll(async () => {
    client = await new MongoClient(uri!, { serverSelectionTimeoutMS: 5000 }).connect();
    await ensureIndexes(await collection());
  });

  afterAll(async () => {
    await client?.db(database).dropDatabase();
    await client?.close();
  });

  beforeEach(async () => {
    await (await collection()).deleteMany({});
  });

  it('cria, lê, atualiza e remove', async () => {
    const created = await new MongoRuleCreator(collection).create(newRule);
    if (created.kind !== 'created') throw new Error('esperava created');
    const { id } = created.rule;

    expect(await new MongoRuleFinder(collection).find(id)).toMatchObject({ id, name: 'Valor máximo' });

    const updated = await new MongoRuleUpdater(collection).update(id, { ...newRule, name: 'Outro', enabled: false });
    expect(updated.kind === 'updated' && updated.rule).toMatchObject({ id, name: 'Outro', enabled: false });
    expect(updated.kind === 'updated' && updated.rule.createdAt).toEqual(created.rule.createdAt);

    expect(await new MongoRuleRemover(collection).remove(id)).toBe('deleted');
    expect(await new MongoRuleRemover(collection).remove(id)).toBe('not_found');
    expect(await new MongoRuleFinder(collection).find(id)).toBeNull();
  });

  it('índice único com collation recusa nome repetido sem diferenciar maiúsculas', async () => {
    const creator = new MongoRuleCreator(collection);
    await creator.create(newRule);

    expect(await creator.create({ ...newRule, name: 'VALOR MÁXIMO' })).toEqual({ kind: 'duplicate_name' });
  });

  it('update com nome de outra regra vira duplicate_name; id inexistente vira not_found', async () => {
    const creator = new MongoRuleCreator(collection);
    const first = await creator.create(newRule);
    await creator.create({ ...newRule, name: 'Segunda' });
    if (first.kind !== 'created') throw new Error('esperava created');

    expect(await new MongoRuleUpdater(collection).update(first.rule.id, { ...newRule, name: 'segunda' })).toEqual({
      kind: 'duplicate_name',
    });
    expect(await new MongoRuleUpdater(collection).update(randomUUID(), newRule)).toEqual({ kind: 'not_found' });
  });

  it('lista com filtros, ordem e paginação', async () => {
    const creator = new MongoRuleCreator(collection);
    for (let i = 1; i <= 5; i += 1) {
      await creator.create({ ...newRule, name: `Regra ${i}`, enabled: i % 2 === 1 });
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const search = new MongoRuleSearch(collection);

    const all = await search.search({}, 0, 2);
    expect(all.total).toBe(5);
    expect(all.items.map((rule) => rule.name)).toEqual(['Regra 5', 'Regra 4']);
    expect((await search.search({ enabled: true }, 0, 20)).total).toBe(3);
    expect((await search.search({ type: 'BLOCKED_MCC' }, 0, 20)).total).toBe(0);
  });

  it('o probe de saúde responde', async () => {
    await expect(new MongoStoreProbe(collection).ping()).resolves.toBeUndefined();
  });
});
