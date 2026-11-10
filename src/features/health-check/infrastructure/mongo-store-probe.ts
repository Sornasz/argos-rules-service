import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import type { StoreProbe } from '../application/ports/store-probe.js';

export class MongoStoreProbe implements StoreProbe {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async ping(): Promise<void> {
    await (await this.collection()).estimatedDocumentCount();
  }
}
