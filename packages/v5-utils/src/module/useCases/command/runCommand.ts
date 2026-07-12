import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection, Metadata } from "@arts-and-crafts/v5/core/shapes";
import { isRejection } from "../../core/isRejection.ts";
import { hasFailures } from "../../core/hasFailures.ts";
import { RejectionError } from "../../adapters/inbound/RejectionError.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

/**
 * Builds the command, calls `handler.handle`, and throws `RejectionError`/
 * `FailureError` on a non-success result so hosts can short-circuit via their
 * own native error handling. Returns the command itself on success — it
 * carries whatever the caller needs to shape a success response.
 */
export function runCommand<TPayload, TCommand extends Command>(
  createCommand: (payload: TPayload, metadata: Metadata) => TCommand,
  handler: HandleCommand<TCommand, Promise<GatewayFailure[] | Rejection>>,
) {
  return async (payload: TPayload, metadata: Metadata): Promise<TCommand> => {
    const command = createCommand(payload, metadata);
    const result = await handler.handle(command);
    if (isRejection(result)) throw new RejectionError(result);
    if (hasFailures(result)) throw new FailureError(result);
    return command;
  };
}
