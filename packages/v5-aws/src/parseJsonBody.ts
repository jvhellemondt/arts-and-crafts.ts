import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { Result, err, ok } from "neverthrow";
import { parseAsError } from "@arts-and-crafts/v5-utils/core";

/** Parses `event.body` as JSON, yielding err for absent or malformed bodies. */
export function parseJsonBody(
  event: Pick<APIGatewayProxyEventV2, "body">,
): Result<{ body: unknown }, { name: "NoBodyError" | "JSONParseError"; message: string }>;
export function parseJsonBody<TContext extends object>(
  event: Pick<APIGatewayProxyEventV2, "body">,
  context: TContext,
): Result<
  TContext & { body: unknown },
  { name: "NoBodyError" | "JSONParseError"; message: string }
>;
export function parseJsonBody<TContext extends object>(
  event: Pick<APIGatewayProxyEventV2, "body">,
  context?: TContext,
): Result<
  { body: unknown } | (TContext & { body: unknown }),
  { name: "NoBodyError" | "JSONParseError"; message: string }
> {
  if (!event.body)
    return err({ name: "NoBodyError", message: "parseJsonBody > no body found in event" });
  try {
    const body: Record<string, unknown> = JSON.parse(event.body);
    return ok({ ...context, body });
  } catch (e: unknown) {
    const error = parseAsError(e);
    return err({ name: "JSONParseError", message: error.message });
  }
}
