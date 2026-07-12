import type { Context, Next } from "hono";
import type { ZodType } from "zod";
import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import {
  parseWithZodSchema,
  correlationIdFromHeaders,
  causationIdFromHeaders,
} from "@arts-and-crafts/v5-utils/adapters/inbound";

/** Variables these middleware set — type a Hono app as `Hono<PipelineEnv>` to read them typed. */
export interface PipelineVariables {
  payload: unknown;
  correlationId: string;
  causationId: string;
}

export interface PipelineEnv {
  Variables: PipelineVariables;
}

/** Parses `c.req.json()` against `schema`; throws ZodError on invalid input. */
export function parseJsonBodyMiddleware<TPayload>(schema: ZodType<TPayload>) {
  return async (c: Context<PipelineEnv>, next: Next) => {
    const raw = await c.req.json().catch(() => undefined);
    c.set("payload", parseWithZodSchema(schema)(raw));
    await next();
  };
}

/** Parses `c.req.query()` against `schema`; throws ZodError on invalid input. */
export function parseQueryMiddleware<TPayload>(schema: ZodType<TPayload>) {
  return async (c: Context<PipelineEnv>, next: Next) => {
    c.set("payload", parseWithZodSchema(schema)(c.req.query() ?? {}));
    await next();
  };
}

export function correlationIdMiddleware(options?: MetadataOptions) {
  return async (c: Context<PipelineEnv>, next: Next) => {
    c.set("correlationId", correlationIdFromHeaders(options)(c.req.header()));
    await next();
  };
}

export function causationIdMiddleware(options?: MetadataOptions) {
  return async (c: Context<PipelineEnv>, next: Next) => {
    c.set("causationId", causationIdFromHeaders(options)(c.req.header()));
    await next();
  };
}
