import { ZodError } from "zod";
import type { PipelineOutcome } from "./PipelineOutcome.ts";
import type { RejectionHook } from "./RejectionHook.ts";
import type { FailureHook } from "./FailureHook.ts";
import type { RejectionError } from "./RejectionError.ts";
import type { FailureError } from "./FailureError.ts";

const DEFAULT_REJECTION_STATUS = 400;
const DEFAULT_FAILURE_STATUS = 500;

// Checked by `.name` rather than `instanceof` — RejectionError/FailureError
// can end up as distinct class objects across separately-bundled entry
// points (each tsup entry inlines its own copy since chunk splitting is
// disabled), which would make `instanceof` unreliable here.
function isRejectionError(error: unknown): error is RejectionError {
  return error instanceof Error && error.name === "RejectionError";
}

function isFailureError(error: unknown): error is FailureError {
  return error instanceof Error && error.name === "FailureError";
}

/**
 * Turns a thrown ZodError/RejectionError/FailureError into a fixed
 * `{status, body: {code, reason}}` outcome. Rethrows anything else so the
 * host's own error boundary treats it as a genuinely unexpected failure.
 */
export function resolveError(
  error: unknown,
  hooks: { onRejection?: RejectionHook; onFailure?: FailureHook },
): PipelineOutcome {
  if (error instanceof ZodError) {
    return { status: 400, body: error.flatten() };
  }
  if (isRejectionError(error)) {
    const [status, message] = hooks.onRejection?.(error.rejection) ?? [DEFAULT_REJECTION_STATUS];
    return {
      status,
      body: { code: error.rejection.code, reason: message ?? error.rejection.reason },
    };
  }
  if (isFailureError(error)) {
    const [status, message] = hooks.onFailure?.(error.failures) ?? [DEFAULT_FAILURE_STATUS];
    const [first] = error.failures;
    return { status, body: { code: first.code, reason: message ?? first.reason } };
  }
  throw error;
}
