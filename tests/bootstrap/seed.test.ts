import { describe, expect, it } from 'vitest';
import { SEED_RULES, seedRules } from '../../src/bootstrap/seed-data.js';
import { createCreateRuleUseCase } from '../../src/features/create-rule/index.js';
import { MemoryRulesStore } from '../../src/shared/index.js';

describe('seedRules', () => {
  it('cria as 3 regras de exemplo e é idempotente', async () => {
    const store = new MemoryRulesStore();
    const createRule = createCreateRuleUseCase({ persistence: { kind: 'memory', store } });

    const first = await seedRules(createRule);
    const second = await seedRules(createRule);

    expect(SEED_RULES).toHaveLength(3);
    expect(first.created).toHaveLength(3);
    expect(second).toEqual({ created: [], skipped: first.created });
    expect(store.rules.size).toBe(3);
  });
});
