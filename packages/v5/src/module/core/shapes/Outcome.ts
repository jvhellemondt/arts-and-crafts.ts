/**
 * The shared shape of every non-success outcome: a machine-readable `code`
 * and a human-readable `reason`.
 *
 * Specialised by three tagged variants that carry different *meaning* and map
 * to different responses:
 * - `Rejection` — a valid request the domain declined (business rule said no).
 * - `Failure`   — an unexpected fault outside the domain's control (infra).
 * - `Invalid`   — a malformed request that never reached the domain.
 *
 * `Outcome` carries no `kind` of its own; each variant adds the tag that
 * discriminates it at runtime.
 */
export interface Outcome<TCode = string> {
  readonly code: TCode;
  readonly reason: string;
}
