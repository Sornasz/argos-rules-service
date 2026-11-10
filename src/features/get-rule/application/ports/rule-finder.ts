import type { Rule } from '../../domain/rule.js';

export interface RuleFinder {
  /** Devolve null quando a regra não existe. */
  find(id: string): Promise<Rule | null>;
}
