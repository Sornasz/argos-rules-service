import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { updateRulePaths } from './api/update-rule.openapi.js';
import { createUpdateRuleRouter } from './api/update-rule.router.js';
import type { RuleUpdater } from './application/ports/rule-updater.js';
import { UpdateRule } from './application/update-rule.use-case.js';
import { MemoryRuleUpdater } from './infrastructure/memory-rule-updater.js';
import { MongoRuleUpdater } from './infrastructure/mongo-rule-updater.js';

export function createUpdateRuleFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  const updater: RuleUpdater =
    options.persistence.kind === 'mongo'
      ? new MongoRuleUpdater(options.persistence.collection)
      : new MemoryRuleUpdater(options.persistence.store);
  return { router: createUpdateRuleRouter(new UpdateRule(updater)), openApiPaths: updateRulePaths };
}
