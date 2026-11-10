import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { deleteRulePaths } from './api/delete-rule.openapi.js';
import { createDeleteRuleRouter } from './api/delete-rule.router.js';
import { DeleteRule } from './application/delete-rule.use-case.js';
import type { RuleRemover } from './application/ports/rule-remover.js';
import { MemoryRuleRemover } from './infrastructure/memory-rule-remover.js';
import { MongoRuleRemover } from './infrastructure/mongo-rule-remover.js';

export function createDeleteRuleFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  const remover: RuleRemover =
    options.persistence.kind === 'mongo'
      ? new MongoRuleRemover(options.persistence.collection)
      : new MemoryRuleRemover(options.persistence.store);
  return { router: createDeleteRuleRouter(new DeleteRule(remover)), openApiPaths: deleteRulePaths };
}
