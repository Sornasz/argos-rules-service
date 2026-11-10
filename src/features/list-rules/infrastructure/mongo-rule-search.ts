import type { Filter } from 'mongodb';
import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import { documentToStoredRule, type RuleDocument } from '../../../shared/rule-document.js';
import type { RuleSearch } from '../application/ports/rule-search.js';
import type { Rule, RuleFilter } from '../domain/rule.js';

export class MongoRuleSearch implements RuleSearch {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async search(filter: RuleFilter, skip: number, limit: number): Promise<{ items: Rule[]; total: number }> {
    const collection = await this.collection();
    const query: Filter<RuleDocument> = {
      ...(filter.enabled !== undefined && { enabled: filter.enabled }),
      ...(filter.type !== undefined && { type: filter.type }),
    };
    const [documents, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);
    return { items: documents.map(documentToStoredRule), total };
  }
}
