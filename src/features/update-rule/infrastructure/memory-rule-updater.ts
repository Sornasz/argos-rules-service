import type { MemoryRulesStore } from '../../../shared/memory-rules-store.js';
import type { RuleUpdate, RuleUpdater } from '../application/ports/rule-updater.js';
import type { NewRule } from '../domain/rule.js';

export class MemoryRuleUpdater implements RuleUpdater {
  constructor(private readonly store: MemoryRulesStore) {}

  async update(id: string, rule: NewRule): Promise<RuleUpdate> {
    const key = id.toLowerCase();
    const current = this.store.rules.get(key);
    if (!current) return { kind: 'not_found' };
    if (this.store.isNameTaken(rule.name, key)) return { kind: 'duplicate_name' };

    const updated = { ...rule, id: current.id, createdAt: current.createdAt, updatedAt: new Date(), sequence: current.sequence };
    this.store.rules.set(key, updated);
    const { sequence: _sequence, ...visible } = updated;
    return { kind: 'updated', rule: visible };
  }
}
