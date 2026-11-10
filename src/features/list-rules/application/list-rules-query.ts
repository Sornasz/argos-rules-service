import { RULE_TYPES, type RuleFilter, type RuleType } from '../domain/rule.js';

export interface InvalidField {
  readonly field: string;
  readonly reason: string;
}

export interface ListRulesQuery {
  readonly filter: RuleFilter;
  readonly page: number;
}

export type ParsedListRulesQuery =
  | { readonly ok: true; readonly query: ListRulesQuery }
  | { readonly ok: false; readonly invalidFields: InvalidField[] };

/** Valores repetidos (`?page=1&page=2`) chegam como lista e são recusados. */
export function parseListRulesQuery(raw: Record<string, unknown>): ParsedListRulesQuery {
  const problems: InvalidField[] = [];
  let enabled: boolean | undefined;
  let type: RuleType | undefined;
  let page = 1;

  if (raw.enabled !== undefined) {
    if (raw.enabled === 'true') enabled = true;
    else if (raw.enabled === 'false') enabled = false;
    else problems.push({ field: 'enabled', reason: 'deve ser true ou false' });
  }
  if (raw.type !== undefined) {
    if (typeof raw.type === 'string' && (RULE_TYPES as readonly string[]).includes(raw.type)) type = raw.type as RuleType;
    else problems.push({ field: 'type', reason: `deve ser um de: ${RULE_TYPES.join(', ')}` });
  }
  if (raw.page !== undefined) {
    if (typeof raw.page === 'string' && /^\d+$/.test(raw.page) && Number(raw.page) >= 1 && Number.isSafeInteger(Number(raw.page))) {
      page = Number(raw.page);
    } else {
      problems.push({ field: 'page', reason: 'deve ser um inteiro maior ou igual a 1' });
    }
  }

  if (problems.length > 0) return { ok: false, invalidFields: problems };
  return { ok: true, query: { filter: { ...(enabled !== undefined && { enabled }), ...(type && { type }) }, page } };
}
