import type { MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { ZodType } from "zod";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { MetadataOptions } from "@arts-and-crafts/v5-utils/core";
import {
  parseWithZodSchema,
  correlationIdFromHeaders,
  causationIdFromHeaders,
} from "@arts-and-crafts/v5-utils/adapters/inbound";

/** Fields these middleware stash on the mutable `event` object (visible to the terminal handler). */
export interface WithPayload<TPayload> {
  __payload: TPayload;
}
export interface WithMetadataFields {
  __correlationId: string;
  __causationId: string;
}
export interface WithCommand<TCommand> {
  __command: TCommand;
}
export interface WithQuery<TQuery> {
  __query: TQuery;
}

function safeJsonParse(body: string | null | undefined): unknown {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/** Parses `event.body` against `schema`; throws ZodError on invalid input. */
export function parseJsonBodyMiddleware<TPayload>(
  schema: ZodType<TPayload>,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      const raw = safeJsonParse(request.event.body);
      (request.event as APIGatewayProxyEventV2 & WithPayload<TPayload>).__payload =
        parseWithZodSchema(schema)(raw);
    },
  };
}

/** Parses `event.queryStringParameters` against `schema`; throws ZodError on invalid input. */
export function parseQueryMiddleware<TPayload>(
  schema: ZodType<TPayload>,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      (request.event as APIGatewayProxyEventV2 & WithPayload<TPayload>).__payload =
        parseWithZodSchema(schema)(request.event.queryStringParameters ?? {});
    },
  };
}

export function correlationIdMiddleware(
  options?: MetadataOptions,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      (request.event as APIGatewayProxyEventV2 & WithMetadataFields).__correlationId =
        correlationIdFromHeaders(options)(request.event.headers ?? {});
    },
  };
}

export function causationIdMiddleware(
  options?: MetadataOptions,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      (request.event as APIGatewayProxyEventV2 & WithMetadataFields).__causationId =
        causationIdFromHeaders(options)(request.event.headers ?? {});
    },
  };
}

/** Maps `__payload`/`__correlationId`/`__causationId` to a command via `toCommand`, stashed as `__command`. */
export function toCommandMiddleware<TPayload, TCommand extends Command>(
  toCommand: (payload: TPayload, metadata: Metadata) => TCommand,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      const event = request.event as APIGatewayProxyEventV2 &
        WithPayload<TPayload> &
        WithMetadataFields;
      (request.event as APIGatewayProxyEventV2 & WithCommand<TCommand>).__command = toCommand(
        event.__payload,
        { correlationId: event.__correlationId, causationId: event.__causationId },
      );
    },
  };
}

/** Maps `__payload`/`__correlationId`/`__causationId` to a query via `toQuery`, stashed as `__query`. */
export function toQueryMiddleware<TPayload, TQuery extends Query>(
  toQuery: (payload: TPayload, metadata: Metadata) => TQuery,
): MiddlewareObj<APIGatewayProxyEventV2> {
  return {
    before: (request) => {
      const event = request.event as APIGatewayProxyEventV2 &
        WithPayload<TPayload> &
        WithMetadataFields;
      (request.event as APIGatewayProxyEventV2 & WithQuery<TQuery>).__query = toQuery(
        event.__payload,
        { correlationId: event.__correlationId, causationId: event.__causationId },
      );
    },
  };
}
