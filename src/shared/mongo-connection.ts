import type { Collection } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { RuleDocument } from './rule-document.js';
import type { RulesCollectionProvider } from './persistence.js';

export const RULES_COLLECTION = 'rules';
export const NAME_INDEX = 'uniq_rule_name_ci';
const DUPLICATE_KEY_CODE = 11000;

export interface MongoConnection {
  readonly collection: RulesCollectionProvider;
  close(): Promise<void>;
}

/** Conecta na primeira chamada; se falhar, a próxima tenta de novo em vez de guardar o erro. */
export function lazyMongo(uri: string, database: string): MongoConnection {
  let pending: Promise<MongoClient> | null = null;
  const client = (): Promise<MongoClient> => {
    pending ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      .connect()
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
    return pending;
  };
  return {
    collection: async () => (await client()).db(database).collection<RuleDocument>(RULES_COLLECTION),
    close: async () => {
      if (pending) await (await pending.catch(() => null))?.close();
      pending = null;
    },
  };
}

/** O nome é único sem diferenciar maiúsculas (collation pt, strength 2). */
export async function ensureIndexes(collection: Collection<RuleDocument>): Promise<void> {
  await collection.createIndex(
    { name: 1 },
    { name: NAME_INDEX, unique: true, collation: { locale: 'pt', strength: 2 } },
  );
  await collection.createIndex({ createdAt: -1 }, { name: 'rule_created_at' });
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === DUPLICATE_KEY_CODE;
}
