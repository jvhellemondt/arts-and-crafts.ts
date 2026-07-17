import type { Metadata } from "./Metadata.ts";
import type { WithIdentifier } from "./WithIdentifier.ts";

export interface Message<TType = string, TPayload = unknown> extends WithIdentifier {
  readonly type: TType;
  readonly kind: "command" | "domain" | "intent" | "integration" | "notification";
  readonly payload: TPayload;
  readonly metadata: Metadata;
  readonly timestamp: number;
}
