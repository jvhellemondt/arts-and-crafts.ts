import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { randomUUID } from "node:crypto";
import { OPEN_MEMBERSHIP } from "./command.ts";
import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { evolveOpenMembership } from "./evolve.ts";

const makeMembershipOpenedV1 = (concerns: StreamKey[]): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  concerns,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { membershipId: randomUUID(), name: "Jane Doe", email: "jane@example.com" },
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
});

describe("evolveOpenMembership", () => {
  const aggregateId = randomUUID();

  it("returns the initial state when given no events", () => {
    const state = evolveOpenMembership(aggregateId, []);
    expect(state).toEqual({ status: "initial", id: aggregateId });
  });

  it("ignores unknown event types and returns the current state", () => {
    const unknown = { type: "Unknown.v1" } as unknown as MembershipOpenedV1;
    const state = evolveOpenMembership(aggregateId, [unknown]);
    expect(state).toEqual({ status: "initial", id: aggregateId });
  });

  describe("MembershipOpened.v1", () => {
    it("transitions to open status", () => {
      const state = evolveOpenMembership(aggregateId, [
        makeMembershipOpenedV1([createStreamKey(ANCHOR_MEMBERSHIP, aggregateId)]),
      ]);
      expect(state.status).toBe("open");
    });

    it("sets name and email from the event payload", () => {
      const state = evolveOpenMembership(aggregateId, [
        makeMembershipOpenedV1([createStreamKey(ANCHOR_MEMBERSHIP, aggregateId)]),
      ]);
      if (state.status !== "open") return;
      expect(state.name).toBe("Jane Doe");
      expect(state.email).toBe("jane@example.com");
    });

    it("preserves the aggregate id", () => {
      const state = evolveOpenMembership(aggregateId, [
        makeMembershipOpenedV1([createStreamKey(ANCHOR_MEMBERSHIP, aggregateId)]),
      ]);
      expect(state.id).toBe(aggregateId);
    });
  });
});
