import { readServiceConfig } from './bootstrap/config.js';
import { createApp } from './bootstrap/server.js';
import { createCreateRuleFeature } from './features/create-rule/index.js';
import { createDeleteRuleFeature } from './features/delete-rule/index.js';
import { createGetRuleFeature } from './features/get-rule/index.js';
import { createHealthCheckFeature } from './features/health-check/index.js';
import { createListRulesFeature } from './features/list-rules/index.js';
import { createUpdateRuleFeature } from './features/update-rule/index.js';
import { MemoryRulesStore, ensureIndexes, lazyMongo, type MongoConnection, type Persistence } from './shared/index.js';

const config = readServiceConfig(process.env);

let mongo: MongoConnection | null = null;
let persistence: Persistence;
if (config.store.kind === 'mongo') {
  mongo = lazyMongo(config.store.uri, config.store.database);
  persistence = { kind: 'mongo', collection: mongo.collection };
  try {
    await ensureIndexes(await mongo.collection());
  } catch (error) {
    console.error(
      JSON.stringify({ event: 'mongo_unavailable', reason: error instanceof Error ? error.message : String(error) }),
    );
    process.exit(1);
  }
} else {
  persistence = { kind: 'memory', store: new MemoryRulesStore() };
  console.warn(
    JSON.stringify({
      event: 'memory_store_enabled',
      message: 'RULES_STORE=memory: os dados somem ao reiniciar. Uso restrito a desenvolvimento.',
    }),
  );
}

const app = createApp({
  features: [
    createListRulesFeature({ persistence }),
    createGetRuleFeature({ persistence }),
    createCreateRuleFeature({ persistence }),
    createUpdateRuleFeature({ persistence }),
    createDeleteRuleFeature({ persistence }),
    createHealthCheckFeature({ persistence }),
  ],
});

const server = app.listen(config.port, () => {
  console.info(JSON.stringify({ event: 'rules_service_started', port: config.port, store: config.store.kind }));
});

async function shutdown(signal: string): Promise<void> {
  console.info(JSON.stringify({ event: 'rules_service_stopping', signal }));
  server.close();
  await mongo?.close();
  process.exit(0);
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
