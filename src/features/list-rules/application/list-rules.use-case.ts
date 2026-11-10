import { PAGE_SIZE, type RulePage } from '../domain/rule.js';
import { parseListRulesQuery, type InvalidField } from './list-rules-query.js';
import type { RuleSearch } from './ports/rule-search.js';

export type ListRulesOutcome =
  | { readonly kind: 'listed'; readonly page: RulePage }
  | { readonly kind: 'invalid'; readonly invalidFields: InvalidField[] };

export interface ListRulesUseCase {
  execute(rawQuery: Record<string, unknown>): Promise<ListRulesOutcome>;
}

export class ListRules implements ListRulesUseCase {
  constructor(private readonly search: RuleSearch) {}

  async execute(rawQuery: Record<string, unknown>): Promise<ListRulesOutcome> {
    const parsed = parseListRulesQuery(rawQuery);
    if (!parsed.ok) return { kind: 'invalid', invalidFields: parsed.invalidFields };

    const { filter, page } = parsed.query;
    const { items, total } = await this.search.search(filter, (page - 1) * PAGE_SIZE, PAGE_SIZE);
    return { kind: 'listed', page: { items, page, pageSize: PAGE_SIZE, total } };
  }
}
