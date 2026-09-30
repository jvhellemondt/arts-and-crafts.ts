import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

/**
 * Builds the error mapper for `ResultAsync.fromPromise`: whatever the gateway
 * threw becomes the `cause` of a `GatewayFailure` naming that gateway.
 */
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
