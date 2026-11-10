import type { Rule } from '../domain/rule.js';
import type { RuleFinder } from './ports/rule-finder.js';

export interface GetRuleUseCase {
  execute(id: string): Promise<Rule | null>;
}

export class GetRule implements GetRuleUseCase {
  constructor(private readonly finder: RuleFinder) {}

  execute(id: string): Promise<Rule | null> {
    return this.finder.find(id);
  }
}
