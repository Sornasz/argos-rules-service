import { describe, expect, it } from 'vitest';
import { ServiceConfigError, readServiceConfig } from '../../src/bootstrap/config.js';

describe('readServiceConfig', () => {
  it('usa porta 3001 e banco argos_rules por padrão', () => {
    expect(readServiceConfig({ MONGODB_URI: 'mongodb://localhost' })).toEqual({
      port: 3001,
      store: { kind: 'mongo', uri: 'mongodb://localhost', database: 'argos_rules' },
    });
  });

  it('lê PORT e MONGODB_DB', () => {
    expect(readServiceConfig({ PORT: '4000', MONGODB_URI: 'mongodb://x', MONGODB_DB: 'outro' })).toMatchObject({
      port: 4000,
      store: { database: 'outro' },
    });
  });

  it('exige MONGODB_URI, sem cair em memória', () => {
    expect(() => readServiceConfig({})).toThrow(ServiceConfigError);
    expect(() => readServiceConfig({ MONGODB_URI: '  ' })).toThrow(/MONGODB_URI/);
  });

  it('aceita memória só com RULES_STORE=memory', () => {
    expect(readServiceConfig({ RULES_STORE: 'memory' }).store).toEqual({ kind: 'memory' });
  });

  it('recusa memória em produção', () => {
    expect(() => readServiceConfig({ RULES_STORE: 'memory', NODE_ENV: 'production' })).toThrow(/production/);
  });

  it.each([{ PORT: '0' }, { PORT: 'abc' }, { PORT: '70000' }])('recusa porta inválida %j', (env) => {
    expect(() => readServiceConfig({ ...env, RULES_STORE: 'memory' })).toThrow(/PORT/);
  });

  it('recusa RULES_STORE desconhecido e nome de banco inválido', () => {
    expect(() => readServiceConfig({ RULES_STORE: 'sql' })).toThrow(/RULES_STORE/);
    expect(() => readServiceConfig({ MONGODB_URI: 'mongodb://x', MONGODB_DB: 'a/b' })).toThrow(/MONGODB_DB/);
  });

  it('reúne todos os problemas numa só mensagem', () => {
    try {
      readServiceConfig({ PORT: 'x' });
    } catch (error) {
      expect((error as ServiceConfigError).problems).toHaveLength(2);
    }
  });
});
