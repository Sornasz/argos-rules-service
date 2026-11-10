export const RULE_TYPES = ['MAX_AMOUNT', 'BLOCKED_MCC'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: RuleType;
  readonly params: { readonly limit: number } | { readonly mcc: string };
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const PAGE_SIZE = 20;

export interface RuleFilter {
  readonly enabled?: boolean;
  readonly type?: RuleType;
}

export interface RulePage {
  readonly items: Rule[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
