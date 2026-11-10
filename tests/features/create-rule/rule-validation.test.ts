import { describe, expect, it } from 'vitest';
import { validateRule } from '../../../src/features/create-rule/domain/rule-validation.js';

const post = { enabledRequired: false };
const put = { enabledRequired: true };

describe('validateRule (domínio)', () => {
  it('aceita MAX_AMOUNT e assume enabled=true no POST', () => {
    const result = validateRule({ name: '  Valor alto ', type: 'MAX_AMOUNT', params: { limit: 100.5 } }, post);

    expect(result).toEqual({
      ok: true,
      rule: { name: 'Valor alto', description: null, type: 'MAX_AMOUNT', params: { limit: 100.5 }, enabled: true },
    });
  });

  it('aceita BLOCKED_MCC e descarta params desconhecidos', () => {
    const result = validateRule(
      { name: 'Apostas', description: 'x', type: 'BLOCKED_MCC', params: { mcc: '7995', extra: 1 }, enabled: false },
      post,
    );

    expect(result).toMatchObject({ ok: true, rule: { params: { mcc: '7995' }, enabled: false, description: 'x' } });
  });

  it('exige enabled quando enabledRequired', () => {
    const result = validateRule({ name: 'Apostas', type: 'BLOCKED_MCC', params: { mcc: '7995' } }, put);

    expect(result).toEqual({ ok: false, invalidFields: [{ field: 'enabled', reason: 'deve ser true ou false' }] });
  });

  it.each([
    [{ name: 'ab', type: 'MAX_AMOUNT', params: { limit: 1 } }, 'name'],
    [{ name: 'a'.repeat(81), type: 'MAX_AMOUNT', params: { limit: 1 } }, 'name'],
    [{ type: 'MAX_AMOUNT', params: { limit: 1 } }, 'name'],
    [{ name: 'Regra', description: 5, type: 'MAX_AMOUNT', params: { limit: 1 } }, 'description'],
    [{ name: 'Regra', description: 'a'.repeat(501), type: 'MAX_AMOUNT', params: { limit: 1 } }, 'description'],
    [{ name: 'Regra', type: 'OUTRO', params: {} }, 'type'],
    [{ name: 'Regra', type: 'MAX_AMOUNT' }, 'params'],
    [{ name: 'Regra', type: 'MAX_AMOUNT', params: [] }, 'params'],
    [{ name: 'Regra', type: 'MAX_AMOUNT', params: { limit: 0 } }, 'params.limit'],
    [{ name: 'Regra', type: 'MAX_AMOUNT', params: { limit: '10' } }, 'params.limit'],
    [{ name: 'Regra', type: 'BLOCKED_MCC', params: { mcc: '123' } }, 'params.mcc'],
    [{ name: 'Regra', type: 'BLOCKED_MCC', params: { mcc: 7995 } }, 'params.mcc'],
    [{ name: 'Regra', type: 'MAX_AMOUNT', params: { limit: 1 }, enabled: 'sim' }, 'enabled'],
  ])('recusa %j apontando %s', (body, field) => {
    const result = validateRule(body, post);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidFields.map((item) => item.field)).toContain(field);
  });

  it.each([null, 'texto', [], 3])('recusa corpo %j', (body) => {
    expect(validateRule(body, post)).toEqual({
      ok: false,
      invalidFields: [{ field: 'body', reason: 'deve ser um objeto JSON' }],
    });
  });
});
