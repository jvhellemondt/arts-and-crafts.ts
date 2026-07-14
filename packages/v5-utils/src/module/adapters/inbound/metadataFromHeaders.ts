import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { HeadersRecord } from "../../core/HeadersRecord.ts";
import type { MetadataOptions } from "../../core/MetadataOptions.ts";
import { correlationIdFromHeaders } from "./correlationIdFromHeaders.ts";
import { causationIdFromHeaders } from "./causationIdFromHeaders.ts";

/** Per-id overrides for how correlation/causation ids are read from headers. */
export interface MetadataFromHeadersOptions {
  readonly correlation?: MetadataOptions;
  readonly causation?: MetadataOptions;
}

/**
 * Derives the tracing `Metadata` (correlation/causation ids) from request
 * headers. Infallible — a missing header falls back to a generated id — so it
 * sits in a pipeline as a plain `.map` step rather than a fallible one.
 */
export function metadataFromHeaders(
  headers: HeadersRecord,
  options: MetadataFromHeadersOptions = {},
): Metadata {
  return {
    correlationId: correlationIdFromHeaders(options.correlation)(headers),
    causationId: causationIdFromHeaders(options.causation)(headers),
  };
}
