import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export function toGatewayFailure(
  gateway: string,
  reason: string,
): (cause: unknown) => GatewayFailure {
  return (cause) => ({
    kind: "failure",
    code: "GATEWAY_FAILURE",
    gateway,
    reason,
    cause,
  });
}
