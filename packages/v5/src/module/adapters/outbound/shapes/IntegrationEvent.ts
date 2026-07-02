import type { Message } from "@core/shapes/Message.ts";
import type { Metadata } from "@core/shapes/Metadata.ts";

export interface IntegrationEvent<TType = string, TPayload = unknown> extends Message<
  TType,
  TPayload
> {
  readonly type: TType;
  readonly kind: "integration";
  readonly payload: TPayload;
  readonly metadata: Metadata;
  readonly timestamp: number;
}
