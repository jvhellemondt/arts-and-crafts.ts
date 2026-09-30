import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";
import { isDomainEvent } from "./isDomainEvent.ts";

const domainEvent: DomainEvent = {
  id: "e-1",
  type: "MembershipStarted.v1",
  kind: "domain",
  timestamp: 1_700_000_000_000,
  concerns: ["Membership#m-1"],
  commandId: "c-1",
  commandType: "StartMembership",
  metadata: { correlationId: "corr-1", causationId: "cause-1" },
  payload: { membershipId: "m-1" },
};

describe("isDomainEvent", () => {
  it("accepts a domain event", () => {
    expect(isDomainEvent(domainEvent)).toBe(true);
  });

  it("does not look at the payload", () => {
    expect(isDomainEvent({ ...domainEvent, payload: undefined })).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "MembershipStarted.v1"],
    ["a number", 42],
  ])("rejects %s", (_, value) => {
    expect(isDomainEvent(value)).toBe(false);
  });

  it("rejects an integration event", () => {
    expect(isDomainEvent({ ...domainEvent, kind: "integration" })).toBe(false);
  });

  it.each([
    ["id", { id: 1 }],
    ["type", { type: undefined }],
    ["timestamp", { timestamp: "2024-01-01T00:00:00.000Z" }],
    ["concerns", { concerns: "Membership#m-1" }],
    ["metadata", { metadata: null }],
    ["metadata", { metadata: "corr-1" }],
  ])("rejects an event whose %s is malformed", (_, override) => {
    expect(isDomainEvent({ ...domainEvent, ...override })).toBe(false);
  });
});
