export const RULE_TYPES = ['MAX_AMOUNT', 'BLOCKED_MCC'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export type RuleParams = { readonly limit: number } | { readonly mcc: string };

export interface RuleDefinition {
  readonly type: RuleType;
  readonly params: RuleParams;
}

export interface NewRule extends RuleDefinition {
  readonly name: string;
  readonly description: string | null;
  readonly enabled: boolean;
}

export interface Rule extends NewRule {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
