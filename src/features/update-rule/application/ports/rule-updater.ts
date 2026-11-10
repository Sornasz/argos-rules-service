import type { NewRule, Rule } from '../../domain/rule.js';

export type RuleUpdate =
  | { readonly kind: 'updated'; readonly rule: Rule }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'duplicate_name' };

export interface RuleUpdater {
  /** Substitui os campos editáveis, preserva `createdAt` e renova `updatedAt`. */
  update(id: string, rule: NewRule): Promise<RuleUpdate>;
}
