import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { InMemoryEventBus } from "@examples/shared/adapters/outbound/EventBus.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import type { ListMembershipsProjection } from "./projection.ts";
import { ListMembershipsProjector } from "./projector.ts";

const makeEvent = (overrides: Partial<MembershipOpenedV1["payload"]> = {}): MembershipOpenedV1 => {
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
  describe("start", () => {
    it("subscribes to the Membership aggregate on the bus", async () => {
      const store = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const bus = new InMemoryEventBus();
      const projector = new ListMembershipsProjector(store);

      projector.start(bus);
      await bus.publish([makeEvent({ aggregateId: "id-1" })]);

      expect(await store.load()).toMatchObject({ "id-1": expect.objectContaining({ id: "id-1" }) });
    });
  });

  describe("consume", () => {
    it("saves the updated projection after applying an event", async () => {
      const store = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const projector = new ListMembershipsProjector(store);
      const event = makeEvent({ aggregateId: "id-1", name: "Ada Lovelace", email: "ada@example.com" });

      await projector.consume(event);

      expect(await store.load()).toEqual({
        "id-1": { id: "id-1", name: "Ada Lovelace", email: "ada@example.com", status: "open" },
      });
    });

    it("preserves existing entries when applying a new event", async () => {
      const store = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const projector = new ListMembershipsProjector(store);

      await projector.consume(makeEvent({ aggregateId: "id-1" }));
      await projector.consume(makeEvent({ aggregateId: "id-2" }));

      expect(Object.keys((await store.load()) as ListMembershipsProjection)).toEqual(
        expect.arrayContaining(["id-1", "id-2"]),
      );
    });

    it("does not save when the store returns a GatewayFailure", async () => {
      const store = new InMemoryProjectionStore<ListMembershipsProjection>({});
      store.simulate("offline");
      const projector = new ListMembershipsProjector(store);

      await projector.consume(makeEvent());

      store.restore();
      expect(await store.load()).toEqual({});
    });
  });
});
