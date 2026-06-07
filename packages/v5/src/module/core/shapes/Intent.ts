import type { Message } from "./Message.ts";
import type { Tag } from "./Tag.ts";

export interface Intent<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "intent";
  /** Tags identifying the subject(s) this intent concerns. */
  readonly tags: readonly Tag[];
  /**
   * Typed domain provenance: the command that produced this intent. Distinct
   * from `Metadata.causationId`, the generic infrastructure tracing pointer.
   */
  readonly commandType: string;
  readonly commandId: string;
}
