import type { NewRule } from '../domain/rule.js';
import { validateRule, type InvalidField } from '../domain/rule-validation.js';

export type { InvalidField };

export type ParsedUpdateRule =
  | { readonly ok: true; readonly rule: NewRule }
  | { readonly ok: false; readonly invalidFields: InvalidField[] };

/** O PUT substitui a regra inteira: só `description` pode faltar. */
export function parseUpdateRuleRequest(body: unknown): ParsedUpdateRule {
  return validateRule(body, { enabledRequired: true });
}
