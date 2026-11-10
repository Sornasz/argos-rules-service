import type { MemoryRulesStore } from '../../../shared/memory-rules-store.js';
import type { RuleSearch } from '../application/ports/rule-search.js';
import type { Rule, RuleFilter } from '../domain/rule.js';

export class MemoryRuleSearch implements RuleSearch {
  constructor(private readonly store: MemoryRulesStore) {}

  async search(filter: RuleFilter, skip: number, limit: number): Promise<{ items: Rule[]; total: number }> {
    const matching = [...this.store.rules.values()]
      .filter((rule) => filter.enabled === undefined || rule.enabled === filter.enabled)
      .filter((rule) => filter.type === undefined || rule.type === filter.type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.sequence - a.sequence);
    const items = matching.slice(skip, skip + limit).map(({ sequence: _sequence, ...rule }) => rule);
    return { items, total: matching.length };
  }
}
