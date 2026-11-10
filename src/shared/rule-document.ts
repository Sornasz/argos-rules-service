export type RuleDocumentType = 'MAX_AMOUNT' | 'BLOCKED_MCC';
export type RuleDocumentParams = { readonly limit: number } | { readonly mcc: string };

interface RuleFields {
  readonly name: string;
  readonly description: string | null;
  readonly type: RuleDocumentType;
  readonly params: RuleDocumentParams;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Forma gravada no MongoDB; o `_id` é o UUID da regra. */
export interface RuleDocument extends RuleFields {
  readonly _id: string;
}

export interface StoredRule extends RuleFields {
  readonly id: string;
}

export function documentToStoredRule(document: RuleDocument): StoredRule {
  const { _id, ...rest } = document;
  return { id: _id, ...rest };
}
