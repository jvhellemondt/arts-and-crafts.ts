import type { Failure } from "@core/shapes/Failure.ts";

/**
 * A specialisation of `Failure` for I/O related infrastructure failures.
 *
 * A `GatewayFailure` is returned as `Err` when an outbound adapter cannot
 * reach its underlying infrastructure — for example, when the event store
 * is offline, a database times out, or an external service is unavailable.
 *
 * It is never the result of a business rule violation. Use `Rejection` for
 * those cases.
 *
 * The `gateway` field identifies which infrastructure component failed,
 * enabling the adapter to map it to an appropriate response — typically
 * HTTP 503.
 *
 * @example
 * const failure: GatewayFailure = {
 *   kind: 'GatewayFailure',
 *   gateway: 'EventStore',
 *   reason: 'Connection refused',
 *   cause: originalError,
 * };
 */
export type GatewayFailure = Failure & {
  readonly kind: "GatewayFailure";
  readonly gateway: string;
};
