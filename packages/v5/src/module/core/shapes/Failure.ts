import type { Outcome } from "./Outcome.ts";

/**
 * A generic failure value object representing something that went wrong
 * outside of the domain's control.
 *
 * `Failure` is a sans-I/O building block — it carries no infrastructure
 * concerns. Adapters specialise it into concrete failure types such as
 * `GatewayFailure` for I/O related failures.
 *
 * Failures are modelled as return values rather than thrown exceptions; the
 * inbound adapter layer lifts them into `Err` values (via neverthrow) so hosts
 * can short-circuit their request pipeline without a try/catch boundary. A
 * `Failure` is always unexpected — if the domain explicitly said no, that is a
 * `Rejection`; if the request was malformed, that is an `Invalid`.
 */
export interface Failure<TCode = string> extends Outcome<TCode> {
  /** Tag that distinguishes a `Failure` from a `Rejection`/`Invalid` at runtime. */
  readonly kind: "failure";
  readonly cause?: unknown;
}
