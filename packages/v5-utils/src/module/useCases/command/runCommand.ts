import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import { isRejection } from "../../core/isRejection.ts";
import { hasFailures } from "../../core/hasFailures.ts";
import { RejectionError } from "../../adapters/inbound/RejectionError.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

/**
 * Calls `handler.handle(command)`, and throws `RejectionError`/`FailureError`
 * on a non-success result so hosts can short-circuit via their own native
 * error handling. Returns the command itself on success.
 */
export async function runCommand<TCommand extends Command>(
  command: TCommand,
  handler: HandleCommand<TCommand, Promise<GatewayFailure[] | Rejection>>,
): Promise<TCommand> {
  const result = await handler.handle(command);
  if (isRejection(result)) throw new RejectionError(result);
  if (hasFailures(result)) throw new FailureError(result);
  return command;
}
