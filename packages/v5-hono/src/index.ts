import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { HeadersRecord } from "@arts-and-crafts/v5-utils/core";
import type { PipelineOutcome } from "@arts-and-crafts/v5-utils/adapters/inbound";

/**
 * Thin, host-specific adapters for wiring a Hono route to the neverthrow
 * pipeline in `@arts-and-crafts/v5-utils`: pull the raw request pieces off the
 * `Context`, and turn a resolved `PipelineOutcome` back into a Hono response.
 * All pipeline logic (parsing, metadata, error mapping) lives in `v5-utils`
 * and is shared with the AWS Lambda host.
 */

/** Parses the request JSON body, yielding `undefined` for absent or malformed bodies. */
export function readJsonBody(c: Context): Promise<unknown> {
  return c.req.json().catch(() => undefined);
}

/** Reads the query-string parameters, defaulting to an empty object. */
export function readQueryParams(c: Context): Record<string, string> {
  return c.req.query() ?? {};
}

/** Reads the request headers (lowercase keys, per Hono's `c.req.header()`). */
export function readHeaders(c: Context): HeadersRecord {
  return c.req.header();
}

/** Renders a resolved `PipelineOutcome` as a Hono JSON response. */
export function respond(c: Context, outcome: PipelineOutcome): Response {
  return c.json(outcome.body, outcome.status as ContentfulStatusCode);
}
