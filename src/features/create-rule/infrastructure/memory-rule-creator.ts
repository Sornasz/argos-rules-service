import type { MemoryRulesStore } from '../../../shared/memory-rules-store.js';
import type { RuleCreation, RuleCreator } from '../application/ports/rule-creator.js';
import type { NewRule, Rule } from '../domain/rule.js';

export class MemoryRuleCreator implements RuleCreator {
  constructor(private readonly store: MemoryRulesStore) {}

  async create(rule: NewRule): Promise<RuleCreation> {
    if (this.store.isNameTaken(rule.name)) return { kind: 'duplicate_name' };
    const now = new Date();
    const created: Rule = { ...rule, id: this.store.newId(), createdAt: now, updatedAt: now };
    this.store.rules.set(created.id, { ...created, sequence: this.store.nextSequence() });
    return { kind: 'created', rule: created };
  }
}
