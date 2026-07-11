import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { randomUUID } from "node:crypto";
import { apply, emptyProjection, type ListMembershipsProjection } from "./projection.ts";
import { OPEN_MEMBERSHIP } from "../../commands/openMembership/command.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";

const makeOpened = (overrides: Partial<{ membershipId: string }> = {}): MembershipOpenedV1 => {
  const membershipId = overrides.membershipId ?? randomUUID();
  return {
    type: "MembershipOpened.v1",
    kind: "domain",
    concerns: [createStreamKey(ANCHOR_MEMBERSHIP, membershipId)],
    timestamp: Date.now(),
    id: randomUUID(),
    metadata: { correlationId: randomUUID(), causationId: randomUUID() },
    payload: { membershipId, name: "Ada Lovelace", email: "ada@example.com" },
    commandId: randomUUID(),
    commandType: OPEN_MEMBERSHIP,
  };
};

describe("listMemberships projection", () => {
  it("starts with an empty projection", () => {
    expect(emptyProjection).toEqual({});
  });

  it("adds an entry for MembershipOpened.v1", () => {
    const membershipId = randomUUID();
    const next = apply(emptyProjection, makeOpened({ membershipId }));

    expect(next[membershipId]).toEqual({
      id: membershipId,
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    });
  });

  it("preserves existing entries when applying a new event", () => {
    const firstId = randomUUID();
    const secondId = randomUUID();
    const afterFirst = apply(emptyProjection, makeOpened({ membershipId: firstId }));
    const afterSecond = apply(afterFirst, makeOpened({ membershipId: secondId }));

    expect(Object.keys(afterSecond)).toEqual(expect.arrayContaining([firstId, secondId]));
  });

  it("returns the same state reference for unrecognised events", () => {
    const unknown: MembershipEventV1 = {
      ...makeOpened(),
      type: "Unknown.v1",
    } as unknown as MembershipEventV1;
    const state: ListMembershipsProjection = {};
    expect(apply(state, unknown)).toBe(state);
  });
});
