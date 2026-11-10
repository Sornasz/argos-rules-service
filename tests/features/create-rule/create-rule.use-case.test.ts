import { describe, expect, it } from 'vitest';
import { CreateRule } from '../../../src/features/create-rule/application/create-rule.use-case.js';
import { MemoryRuleCreator } from '../../../src/features/create-rule/infrastructure/memory-rule-creator.js';
import { MemoryRulesStore } from '../../../src/shared/index.js';

const body = { name: 'Valor máximo', type: 'MAX_AMOUNT', params: { limit: 5000 } };

describe('CreateRule', () => {
  it('cria a regra com id e datas', async () => {
    const store = new MemoryRulesStore();
    const outcome = await new CreateRule(new MemoryRuleCreator(store)).execute(body);

    expect(outcome.kind).toBe('created');
    if (outcome.kind === 'created') {
      expect(outcome.rule).toMatchObject({ name: 'Valor máximo', enabled: true, description: null });
      expect(outcome.rule.createdAt).toEqual(outcome.rule.updatedAt);
      expect(store.rules.has(outcome.rule.id)).toBe(true);
    }
  });

  it('recusa nome repetido sem diferenciar maiúsculas', async () => {
    const useCase = new CreateRule(new MemoryRuleCreator(new MemoryRulesStore()));
    await useCase.execute(body);

    expect(await useCase.execute({ ...body, name: 'VALOR MÁXIMO' })).toEqual({ kind: 'duplicate_name' });
  });

  it('devolve os campos inválidos sem gravar', async () => {
    const store = new MemoryRulesStore();
    const outcome = await new CreateRule(new MemoryRuleCreator(store)).execute({ name: 'x' });

    expect(outcome.kind).toBe('invalid');
    expect(store.rules.size).toBe(0);
  });
});
