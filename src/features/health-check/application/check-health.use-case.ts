import type { HealthStatus, StoreKind } from '../domain/health-status.js';
import type { StoreProbe } from './ports/store-probe.js';

export interface CheckHealthUseCase {
  execute(): Promise<HealthStatus>;
}

export interface CheckHealthDependencies {
  readonly probe: StoreProbe;
  readonly store: StoreKind;
}

/** O serviço só está saudável quando o armazenamento responde. */
export class CheckHealth implements CheckHealthUseCase {
  constructor(private readonly deps: CheckHealthDependencies) {}

  async execute(): Promise<HealthStatus> {
    try {
      await this.deps.probe.ping();
      return { status: 'ok', store: this.deps.store };
    } catch (error) {
      return {
        status: 'unavailable',
        store: this.deps.store,
        reason: error instanceof Error ? error.name : 'erro desconhecido',
      };
    }
  }
}
