import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { Metadata } from "./Metadata.ts";
import type { WithIdentifier } from "./WithIdentifier.ts";

export interface Message<TType = string, TPayload = unknown> extends WithIdentifier {
  readonly type: TType;
  readonly kind:
    | "command"
    | "query"
    | "domain"
    | "intent"
    | "integration"
    | "failure"
    | "rejection";
  readonly payload: TPayload;
  readonly metadata: Metadata;
  readonly timestamp: number;
  readonly concerns: readonly StreamKey[];
}
