import type { Rule, RuleFilter } from '../../domain/rule.js';

export interface RuleSearch {
  /** Mais recentes primeiro. `skip` e `limit` já vêm calculados pelo caso de uso. */
  search(filter: RuleFilter, skip: number, limit: number): Promise<{ readonly items: Rule[]; readonly total: number }>;
}
