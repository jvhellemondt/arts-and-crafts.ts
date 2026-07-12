import type { ZodType } from "zod";

/**
 * Throws the schema's own `ZodError` on invalid input, matching Hono's and
 * middy's native throw-to-short-circuit error handling.
 */
export function parseWithZodSchema<TPayload>(schema: ZodType<TPayload>) {
  return (raw: unknown): TPayload => schema.parse(raw);
}
