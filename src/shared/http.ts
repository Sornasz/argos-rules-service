import type { Response } from 'express';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export interface InvalidField {
  readonly field: string;
  readonly reason: string;
}

export function sendInvalidRequest(response: Response, invalidFields: readonly InvalidField[]): void {
  response.status(400).json({
    error: 'invalid_request',
    message: 'Campos ausentes ou em formato incorreto.',
    invalid_fields: invalidFields,
  });
}

export function sendInvalidId(response: Response, name: string): void {
  sendInvalidRequest(response, [{ field: name, reason: 'deve ser um UUID' }]);
}

export function sendNotFound(response: Response, message: string): void {
  response.status(404).json({ error: 'not_found', message });
}

export function sendDuplicateName(response: Response): void {
  response.status(409).json({ error: 'name_already_exists', message: 'Já existe uma regra com esse nome.' });
}

export interface RuleView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: string;
  readonly params: Record<string, unknown>;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function ruleToJson(rule: RuleView) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    type: rule.type,
    params: rule.params,
    enabled: rule.enabled,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
