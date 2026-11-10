export type StoreKind = 'mongo' | 'memory';

export interface HealthStatus {
  readonly status: 'ok' | 'unavailable';
  readonly store: StoreKind;
  readonly reason?: string;
}
