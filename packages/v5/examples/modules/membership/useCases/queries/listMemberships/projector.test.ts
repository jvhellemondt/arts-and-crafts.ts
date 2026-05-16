import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { InMemoryEventBus } from "@examples/shared/adapters/outbound/EventBus.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import { emptyProjection, type ListMembershipsProjection } from "./projection.ts";
import { ListMembershipsProjector } from "./projector.ts";

const makeOpened = (
  overrides: Partial<MembershipOpenedV1["payload"]> = {},
): MembershipOpenedV1 => {
  const aggregateId = overrides.aggregateId ?? randomUUID();
  return {
    type: "MembershipOpened.v1",
    kind: "domain",
    aggregateType: "Membership",
    aggregateId,
    timestamp: Date.now(),
    id: randomUUID(),
    metadata: { correlationId: randomUUID(), causationId: randomUUID() },
    payload: {
      aggregateId,
      name: overrides.name ?? "Ada Lovelace",
      email: overrides.email ?? "ada@example.com",
    },
  };
};

describe("ListMembershipsProjector", () => {
  let store: InMemoryProjectionStore<ListMembershipsProjection>;
  let projector: ListMembershipsProjector;

  beforeEach(() => {
    store = new InMemoryProjectionStore<ListMembershipsProjection>({ ...emptyProjection });
    projector = new ListMembershipsProjector(store);
  });

  it("writes an entry to the projection store on consume", async () => {
    const event = makeOpened();
    await projector.consume(event);
    const state = await store.load();
    expect(state).toMatchObject({ byId: { [event.payload.aggregateId]: { id: event.payload.aggregateId } } });
  });

  it("does not write when the projection store is offline", async () => {
    const event = makeOpened();
    store.simulate("offline");
    await projector.consume(event);
    store.restore();
    expect(await store.load()).toEqual({ byId: {} });
  });

  it("subscribes to the Membership aggregate on start", async () => {
    const bus = new InMemoryEventBus<MembershipEventV1>();
    projector.start(bus);
    const event = makeOpened();
    await bus.publish([event]);
    const state = await store.load();
    expect(state).toMatchObject({ byId: { [event.payload.aggregateId]: { id: event.payload.aggregateId } } });
  });
});
