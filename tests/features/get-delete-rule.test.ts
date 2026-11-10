import { describe, expect, it } from 'vitest';
import { CreateRule } from '../../src/features/create-rule/application/create-rule.use-case.js';
import { MemoryRuleCreator } from '../../src/features/create-rule/infrastructure/memory-rule-creator.js';
import { DeleteRule } from '../../src/features/delete-rule/application/delete-rule.use-case.js';
import { MemoryRuleRemover } from '../../src/features/delete-rule/infrastructure/memory-rule-remover.js';
import { GetRule } from '../../src/features/get-rule/application/get-rule.use-case.js';
import { MemoryRuleFinder } from '../../src/features/get-rule/infrastructure/memory-rule-finder.js';
import { MemoryRulesStore } from '../../src/shared/index.js';

const missing = '3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11';

async function withRule() {
  const store = new MemoryRulesStore();
  const created = await new CreateRule(new MemoryRuleCreator(store)).execute({
    name: 'Apostas',
    type: 'BLOCKED_MCC',
    params: { mcc: '7995' },
  });
  if (created.kind !== 'created') throw new Error('setup');
  return { store, id: created.rule.id };
}

describe('GetRule', () => {
  it('devolve a regra sem expor campos internos', async () => {
    const { store, id } = await withRule();
    const rule = await new GetRule(new MemoryRuleFinder(store)).execute(id);

    expect(rule).toMatchObject({ id, name: 'Apostas' });
    expect(rule).not.toHaveProperty('sequence');
  });

  it('devolve null quando não existe', async () => {
    const { store } = await withRule();

    expect(await new GetRule(new MemoryRuleFinder(store)).execute(missing)).toBeNull();
  });
});

describe('DeleteRule', () => {
  it('remove e depois não encontra mais', async () => {
    const { store, id } = await withRule();
    const remove = new DeleteRule(new MemoryRuleRemover(store));

    expect(await remove.execute(id)).toBe('deleted');
    expect(await remove.execute(id)).toBe('not_found');
  });
});
