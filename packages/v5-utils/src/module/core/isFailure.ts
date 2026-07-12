import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export function isFailure(value: unknown): value is GatewayFailure {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "failure";
}
