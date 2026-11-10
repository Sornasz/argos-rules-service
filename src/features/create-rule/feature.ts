import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { createRulePaths } from './api/create-rule.openapi.js';
import { createCreateRuleRouter } from './api/create-rule.router.js';
import { CreateRule, type CreateRuleUseCase } from './application/create-rule.use-case.js';
import type { RuleCreator } from './application/ports/rule-creator.js';
import { MemoryRuleCreator } from './infrastructure/memory-rule-creator.js';
import { MongoRuleCreator } from './infrastructure/mongo-rule-creator.js';

/** Também usado pelo seed, que cria regras pela mesma camada de aplicação. */
export function createCreateRuleUseCase(options: { readonly persistence: Persistence }): CreateRuleUseCase {
  const creator: RuleCreator =
    options.persistence.kind === 'mongo'
      ? new MongoRuleCreator(options.persistence.collection)
      : new MemoryRuleCreator(options.persistence.store);
  return new CreateRule(creator);
}

export function createCreateRuleFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  return { router: createCreateRuleRouter(createCreateRuleUseCase(options)), openApiPaths: createRulePaths };
}
