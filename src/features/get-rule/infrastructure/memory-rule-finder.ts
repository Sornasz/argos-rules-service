import type { MemoryRulesStore } from '../../../shared/memory-rules-store.js';
import type { RuleFinder } from '../application/ports/rule-finder.js';
import type { Rule } from '../domain/rule.js';

export class MemoryRuleFinder implements RuleFinder {
  constructor(private readonly store: MemoryRulesStore) {}

  async find(id: string): Promise<Rule | null> {
    const stored = this.store.rules.get(id.toLowerCase());
    if (!stored) return null;
    const { sequence: _sequence, ...rule } = stored;
    return rule;
  }
}
