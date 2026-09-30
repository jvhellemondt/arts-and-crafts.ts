import type { IntegrationEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { isIntegrationEvent } from "./isIntegrationEvent.ts";

const integrationEvent: IntegrationEvent = {
  id: "e-1",
  type: "MembershipStarted.v1",
  kind: "integration",
  timestamp: 1_700_000_000_000,
  metadata: { correlationId: "corr-1", causationId: "cause-1" },
  payload: { membershipId: "m-1" },
};

describe("isIntegrationEvent", () => {
  it("accepts an integration event", () => {
    expect(isIntegrationEvent(integrationEvent)).toBe(true);
  });

  it("does not look at the payload", () => {
    expect(isIntegrationEvent({ ...integrationEvent, payload: undefined })).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "MembershipStarted.v1"],
    ["a number", 42],
  ])("rejects %s", (_, value) => {
    expect(isIntegrationEvent(value)).toBe(false);
  });

  it("rejects a domain event", () => {
    expect(isIntegrationEvent({ ...integrationEvent, kind: "domain" })).toBe(false);
  });

  it.each([
    ["id", { id: 1 }],
    ["type", { type: undefined }],
    ["timestamp", { timestamp: "2024-01-01T00:00:00.000Z" }],
    ["metadata", { metadata: null }],
    ["metadata", { metadata: "corr-1" }],
  ])("rejects an event whose %s is malformed", (_, override) => {
    expect(isIntegrationEvent({ ...integrationEvent, ...override })).toBe(false);
  });
});
