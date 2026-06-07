import type { Metadata } from "./Metadata.ts";
import type { Tag } from "./Tag.ts";
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
   * Dynamic consistency boundary coordinates. Optional on the base because not
   * every message is scoped to a boundary (e.g. a collection `Query`).
   * Boundary-bound messages — `Command`, `DomainEvent`, `Intent`,
   * `Notification` — re-declare this as required.
   */
  readonly tags?: readonly Tag[];
}
