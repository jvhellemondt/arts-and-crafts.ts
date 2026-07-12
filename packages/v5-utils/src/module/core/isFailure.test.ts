import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { isFailure } from "./isFailure.ts";

const FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "TestGateway",
  reason: "boom",
};

describe("isFailure", () => {
  it("returns true for a GatewayFailure", () => {
    expect(isFailure(FAILURE)).toBe(true);
  });

  it("returns false for a rejection (different kind value)", () => {
    expect(isFailure({ kind: "rejection", code: "X", reason: "y" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isFailure(null)).toBe(false);
  });

  it("returns false for a non-object value", () => {
    expect(isFailure("failure")).toBe(false);
  });

  it("returns false for an object without a kind property", () => {
    expect(isFailure({})).toBe(false);
  });
});
