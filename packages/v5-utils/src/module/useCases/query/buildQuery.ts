import type { Result } from "neverthrow";
import type { ZodError, ZodType } from "zod";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { HeadersRecord } from "../../core/HeadersRecord.ts";
import { parsePayload } from "../../adapters/inbound/parsePayload.ts";
import {
  metadataFromHeaders,
  type MetadataFromHeadersOptions,
} from "../../adapters/inbound/metadataFromHeaders.ts";

export interface BuildQueryArgs<TPayload, TQuery extends Query> {
  readonly schema: ZodType<TPayload>;
  readonly raw: unknown;
  readonly headers: HeadersRecord;
  readonly toQuery: (payload: TPayload, metadata: Metadata) => TQuery;
  readonly metadata?: MetadataFromHeadersOptions;
}

/**
 * Parses `raw` against `schema` and, on success, maps it to a query via
 * `toQuery` using tracing metadata read from `headers`. Returns the query as
 * `Ok` or the schema's `ZodError` as `Err` — no throwing.
 */
export function buildQuery<TPayload, TQuery extends Query>(
  args: BuildQueryArgs<TPayload, TQuery>,
): Result<TQuery, ZodError> {
  return parsePayload(args.schema, args.raw).map((payload) =>
    args.toQuery(payload, metadataFromHeaders(args.headers, args.metadata)),
  );
}
