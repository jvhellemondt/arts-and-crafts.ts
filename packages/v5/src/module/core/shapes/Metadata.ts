/**
 * Infrastructure-level tracing envelope carried by every message.
 *
 * `correlationId`/`causationId` are generic distributed-tracing pointers used
 * for observability and message-chain reconstruction. They are deliberately
 * separate from domain-level provenance: a `DomainEvent`/`Intent` records the
 * command that produced it via the typed `commandId`/`commandType` fields,
 * which carry semantic meaning (and the command *type*) that an opaque
 * `causationId` string does not.
 */
export interface Metadata {
  /** Correlates a flow across services (end-to-end). */
  readonly correlationId: string;
  /** Generic tracing pointer to the immediate cause (often previous message id). */
  readonly causationId: string;
  /** Tenant identifier for multi-tenant systems. */
  readonly tenantId?: string;
  /** Actor or user responsible for the change. */
  readonly actorId?: string;

  /** Room for additive extensions. */
  [key: string]: unknown;
}
