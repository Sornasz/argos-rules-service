import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { getRulePaths } from './api/get-rule.openapi.js';
import { createGetRuleRouter } from './api/get-rule.router.js';
import { GetRule } from './application/get-rule.use-case.js';
import type { RuleFinder } from './application/ports/rule-finder.js';
import { MemoryRuleFinder } from './infrastructure/memory-rule-finder.js';
import { MongoRuleFinder } from './infrastructure/mongo-rule-finder.js';

export function createGetRuleFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  const finder: RuleFinder =
    options.persistence.kind === 'mongo'
      ? new MongoRuleFinder(options.persistence.collection)
      : new MemoryRuleFinder(options.persistence.store);
  return { router: createGetRuleRouter(new GetRule(finder)), openApiPaths: getRulePaths };
}
