import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import type { Context } from "hono";
import { ResultAsync, okAsync } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

const DEFAULT_HEADER_NAME = "x-correlation-id";

/**
 * Reads Hono's `c.req.header()` to retrieve the correlation id,
 * by default: reads `x-correlation-id`, returns uuidv7.
 */
export function correlationIdFromHeaders(options: MetadataOptions = {}) {
  return (c: Context): ResultAsync<{ correlationId: string }, never> => {
    const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
    const idFactory = options.idFactory ?? uuidv7;
    return okAsync({ correlationId: c.req.header(headerName) ?? idFactory() });
  };
}
