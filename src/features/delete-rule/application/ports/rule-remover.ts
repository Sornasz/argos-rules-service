import type { RuleRemoval } from '../../domain/rule-removal.js';

export interface RuleRemover {
  remove(id: string): Promise<RuleRemoval>;
}
