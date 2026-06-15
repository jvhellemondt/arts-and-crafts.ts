import type { Message } from "@core/shapes/Message.ts";

export interface Command<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: "command";
}
