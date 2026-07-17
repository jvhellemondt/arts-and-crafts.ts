import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import { type ResultAsync, okAsync } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

const DEFAULT_HEADER_NAME = "x-causation-id";

/**
 * Reads API Gateway v2's `event.headers` to retrieve the causation id,
 * by default: reads `x-causation-id`, returns uuidv7.
 */
export function causationIdFromHeaders(options: MetadataOptions = {}) {
  return (
    event: Pick<APIGatewayProxyEventV2, "headers">,
  ): ResultAsync<{ causationId: string }, never> => {
    const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
    const idFactory = options.idFactory ?? uuidv7;
    return okAsync({ causationId: event.headers?.[headerName] ?? idFactory() });
  };
}
