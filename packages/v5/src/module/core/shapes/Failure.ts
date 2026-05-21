/**
 * A generic failure value object representing something that went wrong
 * outside of the domain's control.
 *
 * `Failure` is a sans-I/O building block — it carries no infrastructure
 * concerns. Adapters specialise it into concrete failure types such as
 * `GatewayFailure` for I/O related failures.
 *
 * Failures are modelled as `Err` values via neverthrow, not as thrown
 * exceptions. A `Failure` is always unexpected — if the domain explicitly
 * said no, that is a `Rejection`, not a `Failure`.
 */
export interface Failure<TCode = string> {
  readonly code: TCode;
  readonly reason: string;
  readonly cause?: unknown;
}
