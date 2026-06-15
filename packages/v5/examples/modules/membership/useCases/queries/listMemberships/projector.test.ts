import type { AdvanceCheckpoint } from "@adapters/outbound/capabilities/AdvanceCheckpoint.ts";
import type { LoadCheckpoint } from "@adapters/outbound/capabilities/LoadCheckpoint.ts";
import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { SaveProjection } from "@adapters/outbound/capabilities/SaveProjection.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import type { ListMembershipsProjection } from "./projection.ts";
import { ListMembershipsProjector } from "./projector.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";

const stubFailure: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "Stub",
  reason: "stub failure",
};

type StubStore = LoadProjection<ListMembershipsProjection> &
  SaveProjection<ListMembershipsProjection> &
  LoadCheckpoint &
  AdvanceCheckpoint;

const stubStore = (overrides: Partial<StubStore>): StubStore => ({
  load: async () => ({}),
  save: async () => {},
  loadCheckpoint: async () => 0,
  advanceCheckpoint: async () => {},
  ...overrides,
});

const makeEvent = (overrides: Partial<{ aggregateId: string }> = {}): MembershipOpenedV1 => {
  const aggregateId = overrides.aggregateId ?? randomUUID();
  return {
    type: "MembershipOpened.v1",
    kind: "domain",
    concerns: [createStreamKey(ANCHOR_MEMBERSHIP, aggregateId)],
    commandId: randomUUID(),
    commandType: "OpenMembership",
    timestamp: Date.now(),
    id: randomUUID(),
    metadata: { correlationId: randomUUID(), causationId: randomUUID() },
    payload: {
      name: "Ada Lovelace",
      email: "ada@example.com",
    },
  };
};

describe("ListMembershipsProjector", () => {
  describe("tick", () => {
    it("applies appended events to the projection", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await eventStore.append([makeEvent({ aggregateId: "id-1" })]);
      await projector.tick();

      expect(await projectionStore.load()).toMatchObject({
        "Membership#id-1": expect.objectContaining({ id: "Membership#id-1" }),
      });
    });

    it("advances the checkpoint to the last applied globalPosition", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await eventStore.append([
        makeEvent({ aggregateId: "id-1" }),
        makeEvent({ aggregateId: "id-2" }),
        makeEvent({ aggregateId: "id-3" }),
      ]);
      await projector.tick();

      expect(await projectionStore.loadCheckpoint()).toBe(3);
    });

    it("resumes from the saved checkpoint on the next tick", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await eventStore.append([
        makeEvent({ aggregateId: "id-1" }),
        makeEvent({ aggregateId: "id-2" }),
      ]);
      await projector.tick();

      await eventStore.append([
        makeEvent({ aggregateId: "id-3" }),
        makeEvent({ aggregateId: "id-4" }),
      ]);
      await projector.tick();

      const state = (await projectionStore.load()) as ListMembershipsProjection;
      expect(Object.keys(state)).toEqual(
        expect.arrayContaining([
          "Membership#id-1",
          "Membership#id-2",
          "Membership#id-3",
          "Membership#id-4",
        ]),
      );
      expect(await projectionStore.loadCheckpoint()).toBe(4);
    });

    it("does nothing when no new events are available", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await projector.tick();

      expect(await projectionStore.load()).toEqual({});
      expect(await projectionStore.loadCheckpoint()).toBe(0);
    });

    it("does not advance the checkpoint when the projection store is offline", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await eventStore.append([makeEvent({ aggregateId: "id-1" })]);
      projectionStore.simulate("offline");
      await projector.tick();

      projectionStore.restore();
      expect(await projectionStore.load()).toEqual({});
      expect(await projectionStore.loadCheckpoint()).toBe(0);
    });

    it("returns early when the event store is offline", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore);

      await eventStore.append([makeEvent({ aggregateId: "id-1" })]);
      eventStore.simulate("offline");
      await projector.tick();

      eventStore.restore();
      expect(await projectionStore.load()).toEqual({});
      expect(await projectionStore.loadCheckpoint()).toBe(0);
    });

    it("bails mid-batch when projection load fails", async () => {
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const advanced: number[] = [];
      const store = stubStore({
        load: async () => stubFailure,
        advanceCheckpoint: async (position) => {
          advanced.push(position);
        },
      });
      const projector = new ListMembershipsProjector(store, eventStore);

      await eventStore.append([makeEvent({ aggregateId: "id-1" })]);
      await projector.tick();

      expect(advanced).toEqual([]);
    });

    it("bails mid-batch when projection save fails", async () => {
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const advanced: number[] = [];
      const store = stubStore({
        save: async () => stubFailure,
        advanceCheckpoint: async (position) => {
          advanced.push(position);
        },
      });
      const projector = new ListMembershipsProjector(store, eventStore);

      await eventStore.append([makeEvent({ aggregateId: "id-1" })]);
      await projector.tick();

      expect(advanced).toEqual([]);
    });

    it("bails mid-batch when checkpoint advance fails", async () => {
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const saved: ListMembershipsProjection[] = [];
      const store = stubStore({
        save: async (state) => {
          saved.push(state);
        },
        advanceCheckpoint: async () => stubFailure,
      });
      const projector = new ListMembershipsProjector(store, eventStore);

      await eventStore.append([
        makeEvent({ aggregateId: "id-1" }),
        makeEvent({ aggregateId: "id-2" }),
      ]);
      await projector.tick();

      expect(saved).toHaveLength(1);
    });

    it("honours batchSize and only applies the configured slice per tick", async () => {
      const projectionStore = new InMemoryProjectionStore<ListMembershipsProjection>({});
      const eventStore = new InMemoryEventStore<MembershipEventV1>();
      const projector = new ListMembershipsProjector(projectionStore, eventStore, 2);

      await eventStore.append([
        makeEvent({ aggregateId: "id-1" }),
        makeEvent({ aggregateId: "id-2" }),
        makeEvent({ aggregateId: "id-3" }),
      ]);
      await projector.tick();

      expect(await projectionStore.loadCheckpoint()).toBe(2);
      await projector.tick();
      expect(await projectionStore.loadCheckpoint()).toBe(3);
    });
  });
});
