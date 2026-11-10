import { createCreateRuleUseCase } from '../features/create-rule/index.js';
import { ensureIndexes, lazyMongo, type Persistence } from '../shared/index.js';
import { readServiceConfig } from './config.js';
import { seedRules } from './seed-data.js';

async function main(): Promise<void> {
  const config = readServiceConfig(process.env);
  if (config.store.kind !== 'mongo') {
    throw new Error('O seed exige MONGODB_URI e RULES_STORE=mongo: não faz sentido popular a memória.');
  }
  const mongo = lazyMongo(config.store.uri, config.store.database);
  try {
    await ensureIndexes(await mongo.collection());
    const persistence: Persistence = { kind: 'mongo', collection: mongo.collection };
    const { created, skipped } = await seedRules(createCreateRuleUseCase({ persistence }));
    console.info(JSON.stringify({ event: 'seed_done', created, skipped }));
  } finally {
    await mongo.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
