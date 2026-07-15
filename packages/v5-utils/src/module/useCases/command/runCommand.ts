import { ResultAsync, err, ok } from "neverthrow";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import { isRejection } from "../../core/isRejection.ts";
import { hasFailures } from "../../core/hasFailures.ts";

/**
 * Calls `handler.handle(command)` and threads the outcome through neverthrow:
 * the command itself as `Ok` on success, or the domain's own `Rejection` /
 * `GatewayFailure[]` as `Err` — as values, not thrown. A handler that rejects
 * unexpectedly rejects the returned promise, so the host's error boundary
 * still treats it as a genuine 500.
 */
export function runCommand<TCommand extends Command>(
  command: TCommand,
  handler: HandleCommand<TCommand, Promise<GatewayFailure[] | Rejection>>,
): ResultAsync<TCommand, Rejection | readonly GatewayFailure[]> {
  return ResultAsync.fromSafePromise(handler.handle(command)).andThen((result) => {
    if (isRejection(result)) return err(result);
    if (hasFailures(result)) return err(result);
    return ok(command);
  });
}
