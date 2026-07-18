import type { Invalid } from "@arts-and-crafts/v5/core/shapes";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { type ZodType } from "zod";

/**
 * Parses `candidate` against `schema`, returning the payload as `Ok` or an
 * `Invalid` outcome carrying the schema's issues as `Err`. Errors stay as
 * values — no throwing — so hosts can thread them through a neverthrow
 * pipeline instead of a try/catch boundary.
 */
export function parseSchema<TPayload>(schema: ZodType<TPayload>) {
  return (candidate: unknown): ResultAsync<TPayload, Invalid> => {
    const result = schema.safeParse(candidate);
    return result.success
      ? okAsync(result.data)
      : errAsync({
          kind: "invalid",
          code: "PARSE_FAILED",
          reason: "The candidate did not match the schema",
          validationErrors: result.error?.issues.map((issue) => {
            return {
              code: issue.code,
              field: issue.path.join("."),
              message: issue.message,
            };
          }),
        });
  };
}
