/**
 * Domain events are internal, immutable, state-changing facts appended to the
 * aggregate event stream (event sourcing). They do not leave the bounded
 * context directly; map them to IntegrationEvents when publishing externally.
 */

import type { Message } from "./Message.ts";

export interface DomainEvent<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "domain";
  readonly commandId: string;
  readonly commandType: string;
}
