import type { Message } from "./Message.ts";

export interface Intent<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  kind: "intent";
}
