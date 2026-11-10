import type { Collection } from 'mongodb';
import type { MemoryRulesStore } from './memory-rules-store.js';
import type { RuleDocument } from './rule-document.js';

export type RulesCollectionProvider = () => Promise<Collection<RuleDocument>>;

/** Como as features chegam aos dados: MongoDB, ou memória apenas em desenvolvimento. */
export type Persistence =
  | { readonly kind: 'mongo'; readonly collection: RulesCollectionProvider }
  | { readonly kind: 'memory'; readonly store: MemoryRulesStore };
