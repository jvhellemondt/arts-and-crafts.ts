import { v7 as uuidv7 } from "uuid";
import type { HeadersRecord } from "../../core/HeadersRecord.ts";
import type { MetadataOptions } from "../../core/MetadataOptions.ts";

const DEFAULT_HEADER_NAME = "x-correlation-id";

/**
 * Reads `headers` assuming lowercase keys — the convention both Hono's
 * `c.req.header()` and API Gateway v2's `event.headers` already follow.
 */
export function correlationIdFromHeaders(
  headers: HeadersRecord,
  options: MetadataOptions = {},
): string {
  const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
  const idFactory = options.idFactory ?? uuidv7;
  return headers[headerName] ?? idFactory();
}
