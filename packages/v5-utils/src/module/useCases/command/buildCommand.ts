import type { Result } from "neverthrow";
import type { ZodError, ZodType } from "zod";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { HeadersRecord } from "../../core/HeadersRecord.ts";
import { parsePayload } from "../../adapters/inbound/parsePayload.ts";
import {
  metadataFromHeaders,
  type MetadataFromHeadersOptions,
} from "../../adapters/inbound/metadataFromHeaders.ts";

export interface BuildCommandArgs<TPayload, TCommand extends Command> {
  readonly schema: ZodType<TPayload>;
  readonly raw: unknown;
  readonly headers: HeadersRecord;
  readonly toCommand: (payload: TPayload, metadata: Metadata) => TCommand;
  readonly metadata?: MetadataFromHeadersOptions;
}

/**
 * Parses `raw` against `schema` and, on success, maps it to a command via
 * `toCommand` using tracing metadata read from `headers`. Returns the command
 * as `Ok` or the schema's `ZodError` as `Err` — no throwing.
 */
export function buildCommand<TPayload, TCommand extends Command>(
  args: BuildCommandArgs<TPayload, TCommand>,
): Result<TCommand, ZodError> {
  return parsePayload(args.schema, args.raw).map((payload) =>
    args.toCommand(payload, metadataFromHeaders(args.headers, args.metadata)),
  );
}
