/**
 * A first-class business outcome: the command was valid and understood, but a
 * business rule said no. Distinct from a `Failure`, which is an unexpected,
 * infrastructure-level fault.
 */
export interface Rejection<TCode = string> {
  /** Tag that distinguishes a `Rejection` from a `Failure` at runtime. */
  readonly kind: "rejection";
  readonly code: TCode;
  readonly reason: string;
  readonly validationErrors?: {
    readonly code: string;
    readonly field?: string;
    readonly message?: string;
    readonly expected?: string;
  }[];
}
