import { isDuplicateKeyError } from '../../../shared/mongo-connection.js';
import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import { documentToStoredRule } from '../../../shared/rule-document.js';
import type { RuleUpdate, RuleUpdater } from '../application/ports/rule-updater.js';
import type { NewRule } from '../domain/rule.js';

export class MongoRuleUpdater implements RuleUpdater {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async update(id: string, rule: NewRule): Promise<RuleUpdate> {
    try {
      const document = await (
        await this.collection()
      ).findOneAndUpdate(
        { _id: id.toLowerCase() },
        {
          $set: {
            name: rule.name,
            description: rule.description,
            type: rule.type,
            params: rule.params,
            enabled: rule.enabled,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      return document ? { kind: 'updated', rule: documentToStoredRule(document) } : { kind: 'not_found' };
    } catch (error) {
      if (isDuplicateKeyError(error)) return { kind: 'duplicate_name' };
      throw error;
    }
  }
}
