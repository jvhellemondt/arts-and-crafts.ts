import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { validate as isUuid } from "uuid";
import { causationIdFromHeaders } from "./causationIdFromHeaders.ts";

const buildEvent = (headers: APIGatewayProxyEventV2["headers"] | undefined) =>
  ({ headers }) as Pick<APIGatewayProxyEventV2, "headers">;

describe("causationIdFromHeaders", () => {
  it("returns the x-causation-id header value when present", async () => {
    const result = await causationIdFromHeaders()(buildEvent({ "x-causation-id": "123" }));
    expect(result._unsafeUnwrap()).toEqual({ causationId: "123" });
  });

  it("generates a UUIDv7 when the header is absent", async () => {
    const result = await causationIdFromHeaders()(buildEvent({}));
    expect(isUuid(result._unsafeUnwrap().causationId)).toBeTruthy();
  });

  it("generates a UUIDv7 when the event carries no headers", async () => {
    const result = await causationIdFromHeaders()(buildEvent(undefined));
    expect(isUuid(result._unsafeUnwrap().causationId)).toBeTruthy();
  });

  it("uses a custom header name when provided", async () => {
    const result = await causationIdFromHeaders({ headerName: "x-my-causation" })(
      buildEvent({ "x-my-causation": "custom" }),
    );
    expect(result._unsafeUnwrap()).toEqual({ causationId: "custom" });
  });

  it("uses a custom idFactory when provided", async () => {
    const result = await causationIdFromHeaders({ idFactory: () => "fixed-id" })(buildEvent({}));
    expect(result._unsafeUnwrap()).toEqual({ causationId: "fixed-id" });
  });
});
