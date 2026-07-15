import type { Context } from "hono";
import { err, ok, fromPromise, ResultAsync } from "neverthrow";
import { parseAsError } from "@arts-and-crafts/v5-utils/core";

/** Parses `event.body` as JSON, yielding err for absent or malformed bodies. */
export function parseJsonBody(
  c: Context,
): ResultAsync<{ body: unknown }, { name: "NoBodyError" | "JSONParseError"; message: string }> {
  const result = fromPromise(c.req.json(), (e: unknown) => {
    const error = parseAsError(e);
    return {
      name: "JSONParseError" as const,
      message: error.message,
    };
  });
  return result.andThen((body) => {
    if (Object.keys(body).length === 0)
      return err({
        name: "NoBodyError" as const,
        message: "parseJsonBody > no body found in event",
      });
    return ok({ body });
  });
}
