import type { Message } from "@core/shapes/Message.ts";
import type { Tag } from "@core/shapes/Tag.ts";

export interface Command<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "command";
  /**
   * Tags from which the handler derives the command's dynamic consistency
   * boundary. Optimistic concurrency is enforced by the append condition built
   * from this boundary, not by a per-aggregate expected version.
   */
  readonly tags: readonly Tag[];
}
