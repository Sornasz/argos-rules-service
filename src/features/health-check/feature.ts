import type { FeatureHttp } from '../../shared/feature-http.js';
import type { Persistence } from '../../shared/persistence.js';
import { healthPaths } from './api/health.openapi.js';
import { createHealthRouter } from './api/health.router.js';
import { CheckHealth } from './application/check-health.use-case.js';
import { memoryStoreProbe } from './infrastructure/memory-store-probe.js';
import { MongoStoreProbe } from './infrastructure/mongo-store-probe.js';

export function createHealthCheckFeature(options: { readonly persistence: Persistence }): FeatureHttp {
  const useCase = new CheckHealth({
    probe: options.persistence.kind === 'mongo' ? new MongoStoreProbe(options.persistence.collection) : memoryStoreProbe,
    store: options.persistence.kind,
  });
  return { router: createHealthRouter(useCase), openApiPaths: healthPaths };
}
