import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { Message } from "@core/shapes/Message.ts";

export interface Command<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "command";
  readonly criteria: readonly StreamKey[];
  readonly expectedPosition?: number;
}
