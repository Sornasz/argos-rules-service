import type { Rule } from '../domain/rule.js';
import type { RuleUpdater } from './ports/rule-updater.js';
import { parseUpdateRuleRequest, type InvalidField } from './update-rule-request.js';

export type UpdateRuleOutcome =
  | { readonly kind: 'updated'; readonly rule: Rule }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'duplicate_name' }
  | { readonly kind: 'invalid'; readonly invalidFields: InvalidField[] };

export interface UpdateRuleUseCase {
  execute(id: string, body: unknown): Promise<UpdateRuleOutcome>;
}

export class UpdateRule implements UpdateRuleUseCase {
  constructor(private readonly updater: RuleUpdater) {}

  async execute(id: string, body: unknown): Promise<UpdateRuleOutcome> {
    const parsed = parseUpdateRuleRequest(body);
    if (!parsed.ok) return { kind: 'invalid', invalidFields: parsed.invalidFields };
    return this.updater.update(id, parsed.rule);
  }
}
