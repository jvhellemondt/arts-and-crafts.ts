import type { ZodError } from "zod";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";

/**
 * The three expected error values an inbound pipeline can short-circuit with,
 * carried in the `Err` channel of a `Result`:
 *
 * - `ZodError` — the request failed schema validation.
 * - `Rejection` — the domain understood the command but a business rule said no.
 * - `GatewayFailure[]` — an outbound adapter could not reach its infrastructure.
 *
 * Genuinely unexpected errors are never modelled here — they reject the
 * underlying promise so the host's own error boundary treats them as a 500.
 */
export type PipelineError = ZodError | Rejection | readonly GatewayFailure[];
