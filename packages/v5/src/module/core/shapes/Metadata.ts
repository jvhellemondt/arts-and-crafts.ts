export interface Metadata {
  /** Correlates a flow across services (end-to-end). */
  readonly correlationId: string;
  /** Points to the immediate cause (often previous message id). */
  readonly causationId: string;
  /** Tenant identifier for multi-tenant systems. */
  readonly tenantId?: string;
  /** Actor or user responsible for the change. */
  readonly actorId?: string;

  /** Room for additive extensions. */
  [key: string]: unknown;
}
