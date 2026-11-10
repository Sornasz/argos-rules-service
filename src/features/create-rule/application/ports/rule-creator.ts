import type { NewRule, Rule } from '../../domain/rule.js';

export type RuleCreation =
  | { readonly kind: 'created'; readonly rule: Rule }
  | { readonly kind: 'duplicate_name' };

export interface RuleCreator {
  /** O adapter gera o id e os carimbos de data, e recusa nome repetido sem diferenciar maiúsculas. */
  create(rule: NewRule): Promise<RuleCreation>;
}
