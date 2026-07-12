import { causationIdFromHeaders } from "./causationIdFromHeaders.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("causationIdFromHeaders", () => {
  it("returns the x-request-id header value when present", () => {
    const extract = causationIdFromHeaders();
    expect(extract({ "x-request-id": "abc-123" })).toBe("abc-123");
  });

  it("generates a UUIDv7 when the header is absent", () => {
    const extract = causationIdFromHeaders();
    expect(extract({})).toMatch(UUID_V7_PATTERN);
  });

  it("uses a custom header name when provided", () => {
    const extract = causationIdFromHeaders({ headerName: "x-my-request" });
    expect(extract({ "x-my-request": "custom" })).toBe("custom");
  });

  it("uses a custom idFactory when provided", () => {
    const extract = causationIdFromHeaders({ idFactory: () => "fixed-id" });
    expect(extract({})).toBe("fixed-id");
  });
});
