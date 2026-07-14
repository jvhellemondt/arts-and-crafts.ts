import { type Result, err, ok } from "neverthrow";
import { type ZodError, type ZodType } from "zod";

/**
 * Parses `raw` against `schema`, returning the payload as `Ok` or the schema's
 * own `ZodError` as `Err`. Errors stay as values — no throwing — so hosts can
 * thread them through a neverthrow pipeline instead of a try/catch boundary.
 */
export function parsePayload<TPayload>(
  schema: ZodType<TPayload>,
  raw: unknown,
): Result<TPayload, ZodError> {
  const result = schema.safeParse(raw);
  return result.success ? ok(result.data) : err(result.error);
}
