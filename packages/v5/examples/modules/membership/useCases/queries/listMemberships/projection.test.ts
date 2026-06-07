import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { randomUUID } from "node:crypto";
import { apply, emptyProjection, type ListMembershipsProjection } from "./projection.ts";
import { membershipTag } from "@examples/modules/membership/core/state.ts";
import { OPEN_MEMBERSHIP } from "../../commands/openMembership/command.ts";

const makeOpened = (overrides: Partial<{ id: string }> = {}): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  tags: [membershipTag(overrides.id ?? randomUUID())],
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: {
    name: "Ada Lovelace",
    email: "ada@example.com",
  },
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
});

describe("listMemberships projection", () => {
  it("starts with an empty projection", () => {
    expect(emptyProjection).toEqual({});
  });

  it("adds an entry for MembershipOpened.v1", () => {
    const id = randomUUID();
    const event = makeOpened({ id });

    const next = apply(emptyProjection, event);

    expect(next[id]).toEqual({
      id,
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    });
  });

  it("ignores a MembershipOpened.v1 event without a membership tag", () => {
    const event: MembershipOpenedV1 = { ...makeOpened(), tags: [] };
    const state: ListMembershipsProjection = {};
    expect(apply(state, event)).toBe(state);
  });

  it("preserves existing entries when applying a new event", () => {
    const firstId = randomUUID();
    const secondId = randomUUID();
    const afterFirst = apply(emptyProjection, makeOpened({ id: firstId }));
    const afterSecond = apply(afterFirst, makeOpened({ id: secondId }));

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
