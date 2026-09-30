import type { IntegrationEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";
import { toIntegrationEvent } from "./toIntegrationEvent.ts";

const domainEvent: DomainEvent<"MembershipStarted.v1", { membershipId: string }> = {
  id: "e-1",
  type: "MembershipStarted.v1",
  kind: "domain",
  timestamp: 1_700_000_000_000,
  concerns: ["Membership#m-1", "Member#u-1"],
  commandId: "c-1",
  commandType: "StartMembership",
  metadata: { correlationId: "corr-1", causationId: "cause-1" },
  payload: { membershipId: "m-1" },
};

describe("toIntegrationEvent", () => {
  it("drops the fields that must not leave the bounded context", () => {
    const integrationEvent = toIntegrationEvent(domainEvent);

    expect(integrationEvent).not.toHaveProperty("concerns");
    expect(integrationEvent).not.toHaveProperty("commandId");
    expect(integrationEvent).not.toHaveProperty("commandType");
  });

  it("keeps the id, so a consumer can deduplicate a redelivered event", () => {
    expect(toIntegrationEvent(domainEvent).id).toBe("e-1");
  });

  it("carries the type, timestamp, payload and metadata across unchanged", () => {
    expect(toIntegrationEvent(domainEvent)).toEqual({
      id: "e-1",
      type: "MembershipStarted.v1",
      kind: "integration",
      timestamp: 1_700_000_000_000,
      metadata: { correlationId: "corr-1", causationId: "cause-1" },
      payload: { membershipId: "m-1" },
    });
  });

  it("re-kinds the event as integration", () => {
    expect(toIntegrationEvent(domainEvent).kind).toBe("integration");
  });

  it("keeps the domain event's type and payload types", () => {
    const integrationEvent: IntegrationEvent<"MembershipStarted.v1", { membershipId: string }> =
      toIntegrationEvent(domainEvent);

    expect(integrationEvent.payload.membershipId).toBe("m-1");
  });

  it("leaves the domain event untouched", () => {
    toIntegrationEvent(domainEvent);

    expect(domainEvent.kind).toBe("domain");
    expect(domainEvent.concerns).toHaveLength(2);
  });
});
