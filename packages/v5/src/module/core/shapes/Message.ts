import type { Metadata } from "./Metadata.ts";
import type { WithIdentifier } from "./WithIdentifier.ts";

export interface Message<TType = string, TPayload = unknown> extends WithIdentifier {
  type: TType;
  payload: TPayload;
  timestamp: number;
  metadata: Metadata;
  kind: "command" | "query" | "domain" | "intent" | "integration" | "notification";
}
