import type { RulesCollectionProvider } from '../../../shared/persistence.js';
import { documentToStoredRule } from '../../../shared/rule-document.js';
import type { RuleFinder } from '../application/ports/rule-finder.js';
import type { Rule } from '../domain/rule.js';

export class MongoRuleFinder implements RuleFinder {
  constructor(private readonly collection: RulesCollectionProvider) {}

  async find(id: string): Promise<Rule | null> {
    const document = await (await this.collection()).findOne({ _id: id.toLowerCase() });
    return document ? documentToStoredRule(document) : null;
  }
}
