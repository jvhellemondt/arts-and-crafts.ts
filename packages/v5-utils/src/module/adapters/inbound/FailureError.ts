import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

/**
 * Thrown by `runCommand`/`runQuery` when the handler returns one or more
 * `GatewayFailure`s, so hosts can short-circuit via their own native error
 * handling instead of a return-value check. `failures` is always non-empty.
 */
export class FailureError extends Error {
  constructor(public readonly failures: readonly GatewayFailure[]) {
    super(failures[0].reason);
    this.name = "FailureError";
  }
}
