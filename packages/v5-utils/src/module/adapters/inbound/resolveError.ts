import { ZodError } from "zod";
import { isRejection } from "../../core/isRejection.ts";
import type { PipelineError } from "./PipelineError.ts";
import type { PipelineOutcome } from "./PipelineOutcome.ts";
import type { RejectionHook } from "./RejectionHook.ts";
import type { FailureHook } from "./FailureHook.ts";

const DEFAULT_REJECTION_STATUS = 400;
const DEFAULT_FAILURE_STATUS = 500;

/**
 * Maps an expected `PipelineError` (ZodError/Rejection/GatewayFailure[]) to a
 * fixed `{status, body}` outcome. A pure value mapper: it is fed the `Err`
 * branch of a `Result`, so — unlike the old throw/catch bridge — it never
 * sees, and never rethrows, a genuinely unexpected error.
 *
 * It discriminates on each value's own `instanceof ZodError`/`kind` tag rather
 * than on a bespoke error class's identity, so it is immune to the
 * cross-bundle `instanceof` pitfalls that separately-bundled entry points
 * would otherwise introduce.
 */
export function resolveError(
  error: PipelineError,
  hooks: { onRejection?: RejectionHook; onFailure?: FailureHook },
): PipelineOutcome {
  if (error instanceof ZodError) {
    return { status: 400, body: error.flatten() };
  }
  if (isRejection(error)) {
    const [status, message] = hooks.onRejection?.(error) ?? [DEFAULT_REJECTION_STATUS];
    return { status, body: { code: error.code, reason: message ?? error.reason } };
  }
  const [status, message] = hooks.onFailure?.(error) ?? [DEFAULT_FAILURE_STATUS];
  const [first] = error;
  return { status, body: { code: first.code, reason: message ?? first.reason } };
}
