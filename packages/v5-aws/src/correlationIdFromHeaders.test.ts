import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { validate as isUuid } from "uuid";
import { correlationIdFromHeaders } from "./correlationIdFromHeaders.ts";

const buildEvent = (headers: APIGatewayProxyEventV2["headers"] | undefined) =>
  ({ headers }) as Pick<APIGatewayProxyEventV2, "headers">;

describe("correlationIdFromHeaders", () => {
  it("returns the x-correlation-id header value when present", async () => {
    const result = await correlationIdFromHeaders()(buildEvent({ "x-correlation-id": "123" }));
    expect(result._unsafeUnwrap()).toEqual({ correlationId: "123" });
  });

  it("generates a UUIDv7 when the header is absent", async () => {
    const result = await correlationIdFromHeaders()(buildEvent({}));
    expect(isUuid(result._unsafeUnwrap().correlationId)).toBeTruthy();
  });

  it("generates a UUIDv7 when the event carries no headers", async () => {
    const result = await correlationIdFromHeaders()(buildEvent(undefined));
    expect(isUuid(result._unsafeUnwrap().correlationId)).toBeTruthy();
  });

  it("uses a custom header name when provided", async () => {
    const result = await correlationIdFromHeaders({ headerName: "x-my-correlation" })(
      buildEvent({ "x-my-correlation": "custom" }),
    );
    expect(result._unsafeUnwrap()).toEqual({ correlationId: "custom" });
  });

  it("uses a custom idFactory when provided", async () => {
    const result = await correlationIdFromHeaders({ idFactory: () => "fixed-id" })(buildEvent({}));
    expect(result._unsafeUnwrap()).toEqual({ correlationId: "fixed-id" });
  });
});
