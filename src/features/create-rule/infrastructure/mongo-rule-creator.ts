import { randomUUID } from 'node:crypto';
import { isDuplicateKeyError } from '../../../shared/mongo-connection.js';
import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import type { RuleCreation, RuleCreator } from '../application/ports/rule-creator.js';
import type { NewRule, Rule } from '../domain/rule.js';

export class MongoRuleCreator implements RuleCreator {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async create(rule: NewRule): Promise<RuleCreation> {
    const now = new Date();
    const created: Rule = { ...rule, id: randomUUID(), createdAt: now, updatedAt: now };
    try {
      const { id, ...fields } = created;
      await (await this.collection()).insertOne({ _id: id, ...fields });
    } catch (error) {
      if (isDuplicateKeyError(error)) return { kind: 'duplicate_name' };
      throw error;
    }
    return { kind: 'created', rule: created };
  }
}
