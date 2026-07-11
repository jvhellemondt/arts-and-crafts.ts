import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export function isFailure(result: unknown): result is GatewayFailure {
  return (
    typeof result === "object" && result !== null && "kind" in result && result.kind === "failure"
  );
}
