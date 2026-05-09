import type { Message } from "@core/shapes/Message.ts";

export interface Notification<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  kind: "notification";
}
