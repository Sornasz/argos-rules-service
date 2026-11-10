import { describe, expect, it } from 'vitest';
import { CreateRule } from '../../../src/features/create-rule/application/create-rule.use-case.js';
import { MemoryRuleCreator } from '../../../src/features/create-rule/infrastructure/memory-rule-creator.js';
import { parseListRulesQuery } from '../../../src/features/list-rules/application/list-rules-query.js';
import { ListRules } from '../../../src/features/list-rules/application/list-rules.use-case.js';
import { MemoryRuleSearch } from '../../../src/features/list-rules/infrastructure/memory-rule-search.js';
import { MemoryRulesStore } from '../../../src/shared/index.js';

describe('parseListRulesQuery', () => {
  it('usa page=1 e nenhum filtro por padrão', () => {
    expect(parseListRulesQuery({})).toEqual({ ok: true, query: { filter: {}, page: 1 } });
  });

  it('lê enabled, type e page', () => {
    expect(parseListRulesQuery({ enabled: 'false', type: 'BLOCKED_MCC', page: '3' })).toEqual({
      ok: true,
      query: { filter: { enabled: false, type: 'BLOCKED_MCC' }, page: 3 },
    });
  });

  it.each([
    [{ enabled: 'talvez' }, 'enabled'],
    [{ type: 'X' }, 'type'],
    [{ page: '0' }, 'page'],
    [{ page: '-1' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ page: ['1', '2'] }, 'page'],
  ])('recusa %j', (raw, field) => {
    const parsed = parseListRulesQuery(raw);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.invalidFields[0]?.field).toBe(field);
  });
});

describe('ListRules', () => {
  async function filled(count: number) {
    const store = new MemoryRulesStore();
    const create = new CreateRule(new MemoryRuleCreator(store));
    for (let i = 1; i <= count; i += 1) {
      await create.execute(
        i % 2 === 0
          ? { name: `Regra ${i}`, type: 'BLOCKED_MCC', params: { mcc: '7995' }, enabled: false }
          : { name: `Regra ${i}`, type: 'MAX_AMOUNT', params: { limit: i } },
      );
    }
    return new ListRules(new MemoryRuleSearch(store));
  }

  it('pagina de 20 em 20, das mais recentes para as mais antigas', async () => {
    const list = await filled(25);
    const first = await list.execute({});
    const second = await list.execute({ page: '2' });

    expect(first.kind === 'listed' && first.page.items.length).toBe(20);
    expect(first.kind === 'listed' && first.page.items[0]?.name).toBe('Regra 25');
    expect(first.kind === 'listed' && first.page).toMatchObject({ page: 1, pageSize: 20, total: 25 });
    expect(second.kind === 'listed' && second.page.items.map((item) => item.name)).toEqual([
      'Regra 5',
      'Regra 4',
      'Regra 3',
      'Regra 2',
      'Regra 1',
    ]);
  });

  it('filtra por enabled e type e combina os dois', async () => {
    const list = await filled(6);
    const disabled = await list.execute({ enabled: 'false' });
    const amount = await list.execute({ type: 'MAX_AMOUNT' });
    const none = await list.execute({ type: 'MAX_AMOUNT', enabled: 'false' });

    expect(disabled.kind === 'listed' && disabled.page.total).toBe(3);
    expect(amount.kind === 'listed' && amount.page.total).toBe(3);
    expect(none.kind === 'listed' && none.page).toMatchObject({ total: 0, items: [] });
  });

  it('página além do fim devolve lista vazia com o total', async () => {
    const list = await filled(3);
    const outcome = await list.execute({ page: '9' });

    expect(outcome.kind === 'listed' && outcome.page).toMatchObject({ items: [], page: 9, total: 3 });
  });

  it('devolve invalid para consulta ruim', async () => {
    expect((await (await filled(1)).execute({ page: '0' })).kind).toBe('invalid');
  });
});
