import type { RuleRemoval } from '../domain/rule-removal.js';
import type { RuleRemover } from './ports/rule-remover.js';

export interface DeleteRuleUseCase {
  execute(id: string): Promise<RuleRemoval>;
}

export class DeleteRule implements DeleteRuleUseCase {
  constructor(private readonly remover: RuleRemover) {}

  execute(id: string): Promise<RuleRemoval> {
    return this.remover.remove(id);
  }
}
