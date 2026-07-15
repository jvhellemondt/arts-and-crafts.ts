import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import type { Context } from "hono";
import { type ResultAsync, okAsync } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

const DEFAULT_HEADER_NAME = "x-causation-id";

/**
 * Reads Hono's `c.req.header()` to retrieve the causation id,
 * by default: reads `x-causation-id`, returns uuidv7.
 */
export function causationIdFromHeaders(options: MetadataOptions = {}) {
  return (c: Context): ResultAsync<{ causationId: string }, never> => {
    const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
    const idFactory = options.idFactory ?? uuidv7;
    return okAsync({ causationId: c.req.header(headerName) ?? idFactory() });
  };
}
