import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { listRulesPaths } from './api/list-rules.openapi.js';
import { createListRulesRouter } from './api/list-rules.router.js';
import { ListRules } from './application/list-rules.use-case.js';
import type { RuleSearch } from './application/ports/rule-search.js';
import { MemoryRuleSearch } from './infrastructure/memory-rule-search.js';
import { MongoRuleSearch } from './infrastructure/mongo-rule-search.js';

export function createListRulesFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  const search: RuleSearch =
    options.persistence.kind === 'mongo'
      ? new MongoRuleSearch(options.persistence.collection)
      : new MemoryRuleSearch(options.persistence.store);
  return { router: createListRulesRouter(new ListRules(search)), openApiPaths: listRulesPaths };
}
