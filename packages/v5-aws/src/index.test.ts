import type { Request } from "@middy/core";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { ZodError, z } from "zod";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { WithCommand, WithMetadataFields, WithPayload, WithQuery } from "./index.ts";
import {
  parseJsonBodyMiddleware,
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  toCommandMiddleware,
  toQueryMiddleware,
} from "./index.ts";

function buildRequest(
  event: Partial<APIGatewayProxyEventV2>,
): Request<
  APIGatewayProxyEventV2 &
    Partial<WithPayload<unknown>> &
    Partial<WithMetadataFields> &
    Partial<WithCommand<unknown>> &
    Partial<WithQuery<unknown>>
> {
  return {
    event: event as APIGatewayProxyEventV2,
    context: {} as Context,
    response: undefined,
    error: undefined,
    internal: {},
  };
}

describe("parseJsonBodyMiddleware", () => {
  const schema = z.object({ name: z.string() });

  it("stashes the parsed payload on event.__payload for valid JSON", () => {
    const request = buildRequest({ body: JSON.stringify({ name: "John" }) });
    parseJsonBodyMiddleware(schema).before!(request);
    expect(request.event.__payload).toEqual({ name: "John" });
  });

  it("throws a ZodError for invalid JSON body", () => {
    const request = buildRequest({ body: JSON.stringify({}) });
    expect(() => parseJsonBodyMiddleware(schema).before!(request)).toThrow(ZodError);
  });

  it("throws a ZodError when the body is malformed JSON", () => {
    const request = buildRequest({ body: "{not json" });
    expect(() => parseJsonBodyMiddleware(schema).before!(request)).toThrow(ZodError);
  });

  it("throws a ZodError when the body is absent", () => {
    const request = buildRequest({ body: undefined });
    expect(() => parseJsonBodyMiddleware(schema).before!(request)).toThrow(ZodError);
  });
});

describe("parseQueryMiddleware", () => {
  const schema = z.object({ status: z.enum(["open", "closed"]).optional() });

  it("stashes the parsed payload on event.__payload for valid query params", () => {
    const request = buildRequest({ queryStringParameters: { status: "open" } });
    parseQueryMiddleware(schema).before!(request);
    expect(request.event.__payload).toEqual({ status: "open" });
  });

  it("defaults to an empty object when queryStringParameters is absent", () => {
    const request = buildRequest({ queryStringParameters: undefined });
    parseQueryMiddleware(schema).before!(request);
    expect(request.event.__payload).toEqual({});
  });

  it("throws a ZodError for invalid query params", () => {
    const request = buildRequest({ queryStringParameters: { status: "bogus" } });
    expect(() => parseQueryMiddleware(schema).before!(request)).toThrow(ZodError);
  });
});

describe("correlationIdMiddleware", () => {
  it("stashes the correlationId from the x-correlation-id header", () => {
    const request = buildRequest({ headers: { "x-correlation-id": "abc-123" } });
    correlationIdMiddleware().before!(request);
    expect(request.event.__correlationId).toBe("abc-123");
  });

  it("generates a correlationId when headers is absent", () => {
    const request = buildRequest({ headers: undefined });
    correlationIdMiddleware().before!(request);
    expect(request.event.__correlationId).toEqual(expect.any(String));
  });

  it("honours custom options", () => {
    const request = buildRequest({ headers: {} });
    correlationIdMiddleware({ idFactory: () => "fixed" }).before!(request);
    expect(request.event.__correlationId).toBe("fixed");
  });
});

describe("causationIdMiddleware", () => {
  it("stashes the causationId from the x-request-id header", () => {
    const request = buildRequest({ headers: { "x-request-id": "req-123" } });
    causationIdMiddleware().before!(request);
    expect(request.event.__causationId).toBe("req-123");
  });

  it("generates a causationId when headers is absent", () => {
    const request = buildRequest({ headers: undefined });
    causationIdMiddleware().before!(request);
    expect(request.event.__causationId).toEqual(expect.any(String));
  });

  it("honours custom options", () => {
    const request = buildRequest({ headers: {} });
    causationIdMiddleware({ idFactory: () => "fixed" }).before!(request);
    expect(request.event.__causationId).toBe("fixed");
  });
});

describe("toCommandMiddleware", () => {
  interface TestPayload {
    name: string;
  }

  function toTestCommand(payload: TestPayload, metadata: Metadata) {
    return {
      id: "cmd-1",
      type: "TestCommand" as const,
      kind: "command" as const,
      payload,
      metadata,
      timestamp: 0,
    };
  }

  it("stashes the command built from __payload and metadata on event.__command", () => {
    const request = buildRequest({});
    request.event.__payload = { name: "John" };
    request.event.__correlationId = "corr-1";
    request.event.__causationId = "cause-1";
    toCommandMiddleware(toTestCommand).before!(request);
    expect(request.event.__command).toEqual({
      id: "cmd-1",
      type: "TestCommand",
      kind: "command",
      payload: { name: "John" },
      metadata: { correlationId: "corr-1", causationId: "cause-1" },
      timestamp: 0,
    });
  });
});

describe("toQueryMiddleware", () => {
  interface TestPayload {
    status?: string;
  }

  function toTestQuery(payload: TestPayload, metadata: Metadata) {
    return {
      id: "qry-1",
      type: "TestQuery" as const,
      kind: "query" as const,
      payload,
      metadata,
      timestamp: 0,
    };
  }

  it("stashes the query built from __payload and metadata on event.__query", () => {
    const request = buildRequest({});
    request.event.__payload = { status: "open" };
    request.event.__correlationId = "corr-2";
    request.event.__causationId = "cause-2";
    toQueryMiddleware(toTestQuery).before!(request);
    expect(request.event.__query).toEqual({
      id: "qry-1",
      type: "TestQuery",
      kind: "query",
      payload: { status: "open" },
      metadata: { correlationId: "corr-2", causationId: "cause-2" },
      timestamp: 0,
    });
  });
});
