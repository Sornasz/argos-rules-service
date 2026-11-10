import type { NewRule, RuleDefinition } from './rule.js';
import { RULE_TYPES } from './rule.js';

export interface InvalidField {
  readonly field: string;
  readonly reason: string;
}

export type RuleValidation =
  | { readonly ok: true; readonly rule: NewRule }
  | { readonly ok: false; readonly invalidFields: InvalidField[] };

export const NAME_MIN = 3;
export const NAME_MAX = 80;
export const DESCRIPTION_MAX = 500;
const MCC_PATTERN = /^\d{4}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readName(value: unknown, problems: InvalidField[]): string {
  if (typeof value !== 'string') {
    problems.push({ field: 'name', reason: 'é obrigatório e deve ser texto' });
    return '';
  }
  const name = value.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    problems.push({ field: 'name', reason: `deve ter entre ${NAME_MIN} e ${NAME_MAX} caracteres` });
  }
  return name;
}

function readDescription(value: unknown, problems: InvalidField[]): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    problems.push({ field: 'description', reason: 'deve ser texto ou null' });
    return null;
  }
  const description = value.trim();
  if (description.length > DESCRIPTION_MAX) {
    problems.push({ field: 'description', reason: `deve ter no máximo ${DESCRIPTION_MAX} caracteres` });
  }
  return description === '' ? null : description;
}

function readDefinition(type: unknown, params: unknown, problems: InvalidField[]): RuleDefinition | null {
  if (typeof type !== 'string' || !(RULE_TYPES as readonly string[]).includes(type)) {
    problems.push({ field: 'type', reason: `deve ser um de: ${RULE_TYPES.join(', ')}` });
    return null;
  }
  if (!isObject(params)) {
    problems.push({ field: 'params', reason: 'é obrigatório e deve ser um objeto' });
    return null;
  }
  if (type === 'MAX_AMOUNT') {
    const limit = params.limit;
    if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
      problems.push({ field: 'params.limit', reason: 'deve ser um número maior que zero' });
      return null;
    }
    return { type: 'MAX_AMOUNT', params: { limit } };
  }
  const mcc = params.mcc;
  if (typeof mcc !== 'string' || !MCC_PATTERN.test(mcc)) {
    problems.push({ field: 'params.mcc', reason: 'deve ser um texto com 4 dígitos' });
    return null;
  }
  return { type: 'BLOCKED_MCC', params: { mcc } };
}

export interface RuleValidationOptions {
  /** true no PUT; false no POST, onde `enabled` assume true quando ausente. */
  readonly enabledRequired: boolean;
}

export function validateRule(body: unknown, options: RuleValidationOptions): RuleValidation {
  if (!isObject(body)) {
    return { ok: false, invalidFields: [{ field: 'body', reason: 'deve ser um objeto JSON' }] };
  }
  const problems: InvalidField[] = [];
  const name = readName(body.name, problems);
  const description = readDescription(body.description, problems);
  const definition = readDefinition(body.type, body.params, problems);

  let enabled = true;
  if (body.enabled === undefined && !options.enabledRequired) {
    enabled = true;
  } else if (typeof body.enabled === 'boolean') {
    enabled = body.enabled;
  } else {
    problems.push({ field: 'enabled', reason: 'deve ser true ou false' });
  }

  if (problems.length > 0 || definition === null) return { ok: false, invalidFields: problems };
  return { ok: true, rule: { ...definition, name, description, enabled } };
}
