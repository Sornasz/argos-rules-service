import type { MemoryRulesStore } from '../../../shared/memory-rules-store.js';
import type { RuleRemover } from '../application/ports/rule-remover.js';
import type { RuleRemoval } from '../domain/rule-removal.js';

export class MemoryRuleRemover implements RuleRemover {
  constructor(private readonly store: MemoryRulesStore) {}

  async remove(id: string): Promise<RuleRemoval> {
    return this.store.rules.delete(id.toLowerCase()) ? 'deleted' : 'not_found';
  }
}
