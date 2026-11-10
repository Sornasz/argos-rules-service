export type RuleType = 'MAX_AMOUNT' | 'BLOCKED_MCC';

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
