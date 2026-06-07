/**
 * Domain events are internal, immutable, state-changing facts appended to the
 * global event log (event sourcing). Each carries the `tags` that place it
 * within one or more dynamic consistency boundaries. They do not leave the
 * bounded context directly; map them to IntegrationEvents when publishing
 * externally.
 */

import type { Message } from "./Message.ts";
import type { Tag } from "./Tag.ts";

export interface DomainEvent<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "domain";
  /** Tags placing this event within one or more consistency boundaries. */
  readonly tags: readonly Tag[];
  /**
   * Typed domain provenance: the command that produced this event. This is the
   * domain-level cause and is intentionally distinct from `Metadata.causationId`,
   * the generic infrastructure tracing pointer.
   */
  readonly commandId: string;
  readonly commandType: string;
}
