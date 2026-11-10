type Env = Readonly<Record<string, string | undefined>>;

export type StoreConfig =
  | { readonly kind: 'mongo'; readonly uri: string; readonly database: string }
  | { readonly kind: 'memory' };

export interface ServiceConfig {
  readonly port: number;
  readonly store: StoreConfig;
}

export class ServiceConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Configuração inválida do rules-service:\n- ${problems.join('\n- ')}`);
    this.name = 'ServiceConfigError';
  }
}

export const DEFAULT_PORT = 3001;
export const DEFAULT_DATABASE = 'argos_rules';
const DATABASE_PATTERN = /^[A-Za-z0-9_-]{1,63}$/;

function value(env: Env, name: string): string | undefined {
  const raw = env[name]?.trim();
  return raw ? raw : undefined;
}

function readPort(env: Env, problems: string[]): number {
  const raw = value(env, 'PORT');
  if (raw === undefined) return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push(`PORT deve ser um inteiro entre 1 e 65535 (recebido "${raw}").`);
    return DEFAULT_PORT;
  }
  return port;
}

/**
 * A memória só existe se for pedida por RULES_STORE=memory e nunca em produção.
 * A ausência de MONGODB_URI é um erro, não um motivo para cair em memória sem avisar.
 */
function readStore(env: Env, problems: string[]): StoreConfig {
  const kind = value(env, 'RULES_STORE') ?? 'mongo';
  if (kind === 'memory') {
    if (value(env, 'NODE_ENV') === 'production') {
      problems.push('RULES_STORE=memory é só para desenvolvimento e não pode ser usado com NODE_ENV=production.');
    }
    return { kind: 'memory' };
  }
  if (kind !== 'mongo') {
    problems.push(`RULES_STORE deve ser "mongo" ou "memory" (recebido "${kind}").`);
    return { kind: 'memory' };
  }
  const uri = value(env, 'MONGODB_URI');
  if (!uri) {
    problems.push('MONGODB_URI é obrigatória (ou use RULES_STORE=memory, só em desenvolvimento).');
    return { kind: 'memory' };
  }
  const database = value(env, 'MONGODB_DB') ?? DEFAULT_DATABASE;
  if (!DATABASE_PATTERN.test(database)) {
    problems.push('MONGODB_DB deve ter de 1 a 63 caracteres entre letras, números, "_" e "-".');
  }
  return { kind: 'mongo', uri, database };
}

export function readServiceConfig(env: Env): ServiceConfig {
  const problems: string[] = [];
  const port = readPort(env, problems);
  const store = readStore(env, problems);
  if (problems.length > 0) throw new ServiceConfigError(problems);
  return { port, store };
}
