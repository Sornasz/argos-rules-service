import type { NewRule } from '../domain/rule.js';
import { validateRule, type InvalidField } from '../domain/rule-validation.js';

export type { InvalidField };

export type ParsedCreateRule =
  | { readonly ok: true; readonly rule: NewRule }
  | { readonly ok: false; readonly invalidFields: InvalidField[] };

export function parseCreateRuleRequest(body: unknown): ParsedCreateRule {
  return validateRule(body, { enabledRequired: false });
}
