import { correlationIdFromHeaders } from "./correlationIdFromHeaders.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("correlationIdFromHeaders", () => {
  it("returns the x-correlation-id header value when present", () => {
    const extract = correlationIdFromHeaders();
    expect(extract({ "x-correlation-id": "abc-123" })).toBe("abc-123");
  });

  it("generates a UUIDv7 when the header is absent", () => {
    const extract = correlationIdFromHeaders();
    expect(extract({})).toMatch(UUID_V7_PATTERN);
  });

  it("uses a custom header name when provided", () => {
    const extract = correlationIdFromHeaders({ headerName: "x-my-correlation" });
    expect(extract({ "x-my-correlation": "custom" })).toBe("custom");
  });

  it("uses a custom idFactory when provided", () => {
    const extract = correlationIdFromHeaders({ idFactory: () => "fixed-id" });
    expect(extract({})).toBe("fixed-id");
  });
});
