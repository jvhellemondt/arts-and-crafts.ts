import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import { type ResultAsync, okAsync } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

const DEFAULT_HEADER_NAME = "x-correlation-id";

/**
 * Reads API Gateway v2's `event.headers` to retrieve the correlation id,
 * by default: reads `x-correlation-id`, returns uuidv7.
 */
export function correlationIdFromHeaders(options: MetadataOptions = {}) {
  return (
    event: Pick<APIGatewayProxyEventV2, "headers">,
  ): ResultAsync<{ correlationId: string }, never> => {
    const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
    const idFactory = options.idFactory ?? uuidv7;
    return okAsync({ correlationId: event.headers?.[headerName] ?? idFactory() });
  };
}
