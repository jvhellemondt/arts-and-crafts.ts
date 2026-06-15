import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { randomUUID } from "node:crypto";
import { apply, emptyProjection, type ListMembershipsProjection } from "./projection.ts";
import { OPEN_MEMBERSHIP } from "../../commands/openMembership/command.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { findConcern } from "@examples/shared/utils/findConcern.ts";

const makeOpened = (overrides: Partial<{ aggregateId: string }> = {}): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  concerns: [createStreamKey(ANCHOR_MEMBERSHIP, overrides.aggregateId ?? randomUUID())],
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
    const event = makeOpened({ aggregateId: id });
    const concern = findConcern(event.concerns, ANCHOR_MEMBERSHIP)!;

    const next = apply(emptyProjection, event);

    expect(next[concern]).toEqual({
      id: concern,
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    });
  });

  it("preserves existing entries when applying a new event", () => {
    const firstId = randomUUID();
    const firstStreamKey = createStreamKey(ANCHOR_MEMBERSHIP, firstId);
    const secondId = randomUUID();
    const secondStreamKey = createStreamKey(ANCHOR_MEMBERSHIP, firstId);
    const afterFirst = apply(emptyProjection, makeOpened({ aggregateId: firstId }));
    const afterSecond = apply(afterFirst, makeOpened({ aggregateId: secondId }));

    expect(Object.keys(afterSecond)).toEqual(
      expect.arrayContaining([firstStreamKey, secondStreamKey]),
    );
  });

  it("returns the same state reference for unrecognised events", () => {
    const unknown: MembershipEventV1 = {
      ...makeOpened(),
      type: "Unknown.v1",
    } as unknown as MembershipEventV1;
    const state: ListMembershipsProjection = {};
    expect(apply(state, unknown)).toBe(state);
  });

  it(`throws an error if the concern ${ANCHOR_MEMBERSHIP} could not be found in the event`, () => {
    const event: MembershipEventV1 = {
      ...makeOpened(),
      concerns: [],
    };
    const state: ListMembershipsProjection = {};
    expect(() => apply(state, event)).toThrow(`${ANCHOR_MEMBERSHIP} concern not found!`);
  });
});
