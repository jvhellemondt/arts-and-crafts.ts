import type { Rejection } from "@arts-and-crafts/v5/core/shapes";

/**
 * Thrown by `runCommand` when the handler returns a `Rejection`, so hosts can
 * short-circuit via their own native error handling instead of a return-value check.
 */
export class RejectionError extends Error {
  constructor(public readonly rejection: Rejection) {
    super(rejection.reason);
    this.name = "RejectionError";
  }
}
