import type { Outcome } from "./Outcome.ts";

/**
 * The request was malformed — it never conformed to the contract, so the
 * domain was never engaged. Distinct from a `Rejection` (a valid request the
 * domain declined) and a `Failure` (an unexpected infrastructure fault).
 *
 * Produced at the inbound boundary — schema parsing (`parseSchema`) and body
 * parsing (`parseJsonBody`) — and typically mapped to HTTP 400. `Invalid` is
 * the sole carrier of `validationErrors`, since it is the only outcome that
 * describes *how* the input failed to conform.
 */
export interface Invalid<TCode = string> extends Outcome<TCode> {
  /** Tag that distinguishes an `Invalid` from a `Rejection`/`Failure` at runtime. */
  readonly kind: "invalid";
  readonly validationErrors?: {
    readonly code: string;
    readonly field?: string;
    readonly message?: string;
    readonly expected?: string;
  }[];
}
