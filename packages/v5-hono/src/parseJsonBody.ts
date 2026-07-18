import type { Context } from "hono";
import { err, ok, fromPromise, ResultAsync } from "neverthrow";
import type { Invalid } from "@arts-and-crafts/v5/core/shapes";
import { parseAsError } from "@arts-and-crafts/v5-utils/core";

/** Parses `c.req.json()`, yielding an `Invalid` outcome for absent or malformed bodies. */
export function parseJsonBody(c: Context): ResultAsync<unknown, Invalid> {
  const result = fromPromise(c.req.json(), (e: unknown) => {
    const error = parseAsError(e);
    return {
      kind: "invalid" as const,
      code: "MALFORMED_JSON",
      reason: error.message,
    };
  });
  return result.andThen((body) => {
    if (Object.keys(body).length === 0)
      return err({
        kind: "invalid" as const,
        code: "NO_BODY",
        reason: "parseJsonBody > no body found in event",
      });
    return ok(body);
  });
}
