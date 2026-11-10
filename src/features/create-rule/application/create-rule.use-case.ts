import type { Rule } from '../domain/rule.js';
import { parseCreateRuleRequest, type InvalidField } from './create-rule-request.js';
import type { RuleCreator } from './ports/rule-creator.js';

export type CreateRuleOutcome =
  | { readonly kind: 'created'; readonly rule: Rule }
  | { readonly kind: 'duplicate_name' }
  | { readonly kind: 'invalid'; readonly invalidFields: InvalidField[] };

export interface CreateRuleUseCase {
  execute(body: unknown): Promise<CreateRuleOutcome>;
}

export class CreateRule implements CreateRuleUseCase {
  constructor(private readonly creator: RuleCreator) {}

  async execute(body: unknown): Promise<CreateRuleOutcome> {
    const parsed = parseCreateRuleRequest(body);
    if (!parsed.ok) return { kind: 'invalid', invalidFields: parsed.invalidFields };
    return this.creator.create(parsed.rule);
  }
}
