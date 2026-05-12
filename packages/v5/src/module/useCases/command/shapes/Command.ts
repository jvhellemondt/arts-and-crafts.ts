import type { Message } from "@core/shapes/Message.ts";

export interface Command<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  kind: "command";
  aggregateType: string;
  aggregateId: string;
  expectedVersion?: number;
}
