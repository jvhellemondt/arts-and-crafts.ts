/**
 * Domain events are internal, immutable, state-changing facts appended to the
 * aggregate event stream (event sourcing). They do not leave the bounded
 * context directly; map them to IntegrationEvents when publishing externally.
 */

import type { StreamKey } from '../../adapters/outbound/shapes/StreamKey.ts';
import type { Message } from './Message.ts';

export interface DomainEvent<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: 'domain';
  readonly concerns: readonly StreamKey[];
  /**
   * Typed domain provenance: the command that produced this event. This is the
   * domain-level cause and is intentionally distinct from `Metadata.causationId`,
   * the generic infrastructure tracing pointer.
   */
  readonly commandId: string;
  readonly commandType: string;
}
