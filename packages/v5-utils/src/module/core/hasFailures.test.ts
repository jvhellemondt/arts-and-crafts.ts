import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { hasFailures } from "./hasFailures.ts";

const FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "TestGateway",
  reason: "boom",
};

describe("hasFailures", () => {
  it("returns true for a non-empty array of GatewayFailure", () => {
    expect(hasFailures([FAILURE])).toBe(true);
  });

  it("returns false for an empty array (implicit success)", () => {
    expect(hasFailures([])).toBe(false);
  });

  it("returns false for an array of non-failure values", () => {
    expect(hasFailures([{ id: "1" }])).toBe(false);
  });

  it("returns false for a non-array value", () => {
    expect(hasFailures(FAILURE)).toBe(false);
  });
});
