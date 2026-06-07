import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { membershipTag } from "@examples/modules/membership/core/tags.ts";
import { randomUUID } from "node:crypto";
import { OPEN_MEMBERSHIP } from "./command.ts";
import { evolveOpenMembership, initialOpenMembershipState } from "./state.ts";

const opened = (): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  tags: [membershipTag(randomUUID())],
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { name: "Jane Doe", email: "jane@example.com" },
});

describe("evolveOpenMembership", () => {
  it("starts from a non-existent membership", () => {
    expect(initialOpenMembershipState).toEqual({ exists: false });
  });

  it("marks the membership as existing on MembershipOpened.v1", () => {
    expect(evolveOpenMembership(initialOpenMembershipState, opened())).toEqual({ exists: true });
  });

  it("ignores unknown event types and returns the current state", () => {
    const unknown = { ...opened(), type: "Unknown.v1" } as unknown as MembershipEventV1;
    expect(evolveOpenMembership(initialOpenMembershipState, unknown)).toBe(initialOpenMembershipState);
  });
});
