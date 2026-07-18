import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { Result, err, ok } from "neverthrow";
import type { Invalid } from "@arts-and-crafts/v5/core/shapes";
import { parseAsError } from "@arts-and-crafts/v5-utils/core";

/** Parses `event.body` as JSON, yielding an `Invalid` outcome for absent or malformed bodies. */
export function parseJsonBody(
  event: Pick<APIGatewayProxyEventV2, "body">,
): Result<unknown, Invalid> {
  if (!event.body)
    return err({
      kind: "invalid",
      code: "NO_BODY",
      reason: "parseJsonBody > no body found in event",
    });
  try {
    const body: unknown = JSON.parse(event.body);
    return ok(body);
  } catch (e: unknown) {
    const error = parseAsError(e);
    return err({ kind: "invalid", code: "MALFORMED_JSON", reason: error.message });
  }
}
