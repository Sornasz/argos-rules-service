import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import type { RuleRemover } from '../application/ports/rule-remover.js';
import type { RuleRemoval } from '../domain/rule-removal.js';

export class MongoRuleRemover implements RuleRemover {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async remove(id: string): Promise<RuleRemoval> {
    const result = await (await this.collection()).deleteOne({ _id: id.toLowerCase() });
    return result.deletedCount > 0 ? 'deleted' : 'not_found';
  }
}
