import type { Metadata } from "./Metadata.ts";
import type { WithIdentifier } from "./WithIdentifier.ts";

export interface Message<TType = string, TPayload = unknown> extends WithIdentifier {
  readonly type: TType;
  readonly kind:
    | "command"
    | "query"
    | "domain"
    | "intent"
    | "integration"
    | "failure"
    | "rejection";
  readonly payload: TPayload;
  readonly metadata: Metadata;
  readonly timestamp: number;
  /**
   * Aggregate coordinates. Optional on the base because not every message is
   * scoped to a single aggregate instance (e.g. a collection `Query`).
   * Aggregate-bound messages — `Command`, `DomainEvent`, `Intent`,
   * `Notification` — re-declare these as required.
   */
  readonly aggregateType?: string;
  readonly aggregateId?: string;
}
