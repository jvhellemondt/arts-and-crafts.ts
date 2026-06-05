import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import { isFailure } from "./isFailure.ts";

const gatewayFailure: GatewayFailure = {
  type: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "EventStore",
  reason: "Connection refused",
};

describe("isFailure", () => {
  it("returns true for a GatewayFailure", () => {
    expect(isFailure(gatewayFailure)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isFailure(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isFailure(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isFailure("failure")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isFailure(42)).toBe(false);
  });

  it("returns false for an object without a type property", () => {
    expect(isFailure({ kind: "GatewayFailure", reason: "oops" })).toBe(false);
  });

  it("returns false for an object with a different type value", () => {
    expect(isFailure({ type: "success" })).toBe(false);
  });
});
