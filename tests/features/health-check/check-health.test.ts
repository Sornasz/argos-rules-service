import { describe, expect, it } from 'vitest';
import { CheckHealth } from '../../../src/features/health-check/application/check-health.use-case.js';

describe('CheckHealth', () => {
  it('ok quando o banco responde', async () => {
    const health = new CheckHealth({ probe: { ping: async () => undefined }, store: 'mongo' });

    expect(await health.execute()).toEqual({ status: 'ok', store: 'mongo' });
  });

  it('unavailable, sem vazar a mensagem, quando o banco não responde', async () => {
    const failing = {
      ping: async () => {
        throw Object.assign(new Error('mongodb://user:senha@host'), { name: 'MongoServerSelectionError' });
      },
    };
    const result = await new CheckHealth({ probe: failing, store: 'mongo' }).execute();

    expect(result).toEqual({ status: 'unavailable', store: 'mongo', reason: 'MongoServerSelectionError' });
  });
});
