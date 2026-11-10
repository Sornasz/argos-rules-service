import type { CreateRuleUseCase } from '../features/create-rule/index.js';

export const SEED_RULES = [
  {
    name: 'Valor máximo por transação',
    description: 'Sinaliza transações acima de R$ 5.000,00.',
    type: 'MAX_AMOUNT',
    params: { limit: 5000 },
    enabled: true,
  },
  {
    name: 'Cassinos e apostas',
    description: 'Categoria 7995 (apostas).',
    type: 'BLOCKED_MCC',
    params: { mcc: '7995' },
    enabled: true,
  },
  {
    name: 'Transferências financeiras',
    description: 'Categoria 4829 (transferência de dinheiro), desativada por padrão.',
    type: 'BLOCKED_MCC',
    params: { mcc: '4829' },
    enabled: false,
  },
] as const;

export interface SeedResult {
  readonly created: string[];
  readonly skipped: string[];
}

/** Idempotente: nome já existente (409) é pulado, não é erro. */
export async function seedRules(createRule: CreateRuleUseCase): Promise<SeedResult> {
  const result: SeedResult = { created: [], skipped: [] };
  for (const rule of SEED_RULES) {
    const outcome = await createRule.execute(rule);
    if (outcome.kind === 'created') result.created.push(rule.name);
    else if (outcome.kind === 'duplicate_name') result.skipped.push(rule.name);
    else throw new Error(`Regra de exemplo inválida: ${rule.name}`);
  }
  return result;
}
