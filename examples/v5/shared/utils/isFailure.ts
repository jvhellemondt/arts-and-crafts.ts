import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";

export function isFailure(result: unknown): result is GatewayFailure {
  return (
    typeof result === "object" && result !== null && "kind" in result && result.kind === "failure"
  );
}
