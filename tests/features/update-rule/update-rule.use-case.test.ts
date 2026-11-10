import { describe, expect, it } from 'vitest';
import { CreateRule } from '../../../src/features/create-rule/application/create-rule.use-case.js';
import { MemoryRuleCreator } from '../../../src/features/create-rule/infrastructure/memory-rule-creator.js';
import { parseUpdateRuleRequest } from '../../../src/features/update-rule/application/update-rule-request.js';
import { UpdateRule } from '../../../src/features/update-rule/application/update-rule.use-case.js';
import { MemoryRuleUpdater } from '../../../src/features/update-rule/infrastructure/memory-rule-updater.js';
import { MemoryRulesStore } from '../../../src/shared/index.js';

const replacement = { name: 'Novo nome', type: 'BLOCKED_MCC', params: { mcc: '7995' }, enabled: false };

async function setup() {
  const store = new MemoryRulesStore();
  const create = new CreateRule(new MemoryRuleCreator(store));
  const first = await create.execute({ name: 'Primeira', type: 'MAX_AMOUNT', params: { limit: 10 } });
  await create.execute({ name: 'Segunda', type: 'MAX_AMOUNT', params: { limit: 20 } });
  if (first.kind !== 'created') throw new Error('setup');
  return { update: new UpdateRule(new MemoryRuleUpdater(store)), id: first.rule.id, createdAt: first.rule.createdAt };
}

describe('UpdateRule', () => {
  it('substitui os campos e preserva createdAt', async () => {
    const { update, id, createdAt } = await setup();
    const outcome = await update.execute(id, replacement);

    expect(outcome.kind).toBe('updated');
    if (outcome.kind === 'updated') {
      expect(outcome.rule).toMatchObject({ id, name: 'Novo nome', type: 'BLOCKED_MCC', params: { mcc: '7995' }, enabled: false });
      expect(outcome.rule.createdAt).toEqual(createdAt);
    }
  });

  it('permite manter o próprio nome', async () => {
    const { update, id } = await setup();

    expect((await update.execute(id, { ...replacement, name: 'PRIMEIRA' })).kind).toBe('updated');
  });

  it('recusa o nome de outra regra', async () => {
    const { update, id } = await setup();

    expect(await update.execute(id, { ...replacement, name: 'segunda' })).toEqual({ kind: 'duplicate_name' });
  });

  it('devolve not_found para id inexistente', async () => {
    const { update } = await setup();

    expect(await update.execute('3f2c9a54-6d1e-4b7a-9c58-2a4f1e0d7b11', replacement)).toEqual({ kind: 'not_found' });
  });

  it('exige enabled no PUT', () => {
    expect(parseUpdateRuleRequest({ name: 'Regra', type: 'MAX_AMOUNT', params: { limit: 1 } }).ok).toBe(false);
  });
});
