import type { Outcome } from "./Outcome.ts";

/**
 * A first-class business outcome: the request was valid and understood, but a
 * business rule said no. Distinct from a `Failure` (an unexpected,
 * infrastructure-level fault) and an `Invalid` (a malformed request that never
 * reached the domain).
 */
export interface Rejection<TCode = string> extends Outcome<TCode> {
  /** Tag that distinguishes a `Rejection` from a `Failure`/`Invalid` at runtime. */
  readonly kind: "rejection";
}
