import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import type { HeadersRecord } from "@arts-and-crafts/v5-utils/core";
import type { PipelineOutcome } from "@arts-and-crafts/v5-utils/adapters/inbound";

/**
 * Thin, host-specific adapters for wiring an API Gateway v2 Lambda to the
 * neverthrow pipeline in `@arts-and-crafts/v5-utils`: pull the raw request
 * pieces off the `event`, and turn a resolved `PipelineOutcome` back into a
 * Lambda result. All pipeline logic (parsing, metadata, error mapping) lives
 * in `v5-utils` and is shared with the Hono host.
 */

/** Parses `event.body` as JSON, yielding `undefined` for absent or malformed bodies. */
export function readJsonBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return undefined;
  try {
    return JSON.parse(event.body);
  } catch {
    return undefined;
  }
}

/** Reads `event.queryStringParameters`, defaulting to an empty object. */
export function readQueryParams(event: APIGatewayProxyEventV2): Record<string, string | undefined> {
  return event.queryStringParameters ?? {};
}

/** Reads `event.headers` (lowercase keys, per API Gateway v2), defaulting to empty. */
export function readHeaders(event: APIGatewayProxyEventV2): HeadersRecord {
  return event.headers ?? {};
}

/** Renders a resolved `PipelineOutcome` as an API Gateway v2 structured result. */
export function toApiGatewayResult(outcome: PipelineOutcome): APIGatewayProxyStructuredResultV2 {
  return { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
}
