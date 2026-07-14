import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { readJsonBody, readQueryParams, readHeaders, toApiGatewayResult } from "./index.ts";

function buildEvent(partial: Partial<APIGatewayProxyEventV2>): APIGatewayProxyEventV2 {
  return partial as APIGatewayProxyEventV2;
}

describe("readJsonBody", () => {
  it("parses a valid JSON body", () => {
    expect(readJsonBody(buildEvent({ body: JSON.stringify({ name: "John" }) }))).toEqual({
      name: "John",
    });
  });

  it("returns undefined for a malformed JSON body", () => {
    expect(readJsonBody(buildEvent({ body: "{not json" }))).toBeUndefined();
  });

  it("returns undefined when the body is absent", () => {
    expect(readJsonBody(buildEvent({ body: undefined }))).toBeUndefined();
  });
});

describe("readQueryParams", () => {
  it("returns the query string parameters", () => {
    expect(readQueryParams(buildEvent({ queryStringParameters: { status: "open" } }))).toEqual({
      status: "open",
    });
  });

  it("defaults to an empty object when absent", () => {
    expect(readQueryParams(buildEvent({ queryStringParameters: undefined }))).toEqual({});
  });
});

describe("readHeaders", () => {
  it("returns the headers", () => {
    expect(readHeaders(buildEvent({ headers: { "x-correlation-id": "abc-123" } }))).toEqual({
      "x-correlation-id": "abc-123",
    });
  });

  it("defaults to an empty object when absent", () => {
    expect(readHeaders(buildEvent({ headers: undefined }))).toEqual({});
  });
});

describe("toApiGatewayResult", () => {
  it("renders a PipelineOutcome as an API Gateway v2 structured result", () => {
    expect(
      toApiGatewayResult({ status: 404, body: { code: "NOT_FOUND", reason: "nope" } }),
    ).toEqual({ statusCode: 404, body: JSON.stringify({ code: "NOT_FOUND", reason: "nope" }) });
  });
});
