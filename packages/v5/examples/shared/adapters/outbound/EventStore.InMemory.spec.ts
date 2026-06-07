import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { LoadEventsFrom } from "@adapters/outbound/capabilities/LoadEventsFrom.ts";
import type { ReadEvents } from "@adapters/outbound/capabilities/ReadEvents.ts";
import type { SimulateFaults } from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { ReadResult } from "@adapters/outbound/shapes/ReadResult.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { Tag } from "@core/shapes/Tag.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { randomUUID } from "node:crypto";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";

interface TestDomainEvent extends DomainEvent<"TestDomainEvent", { name: string }> {}
interface OtherDomainEvent extends DomainEvent<"OtherDomainEvent", { name: string }> {}
type AnyTestEvent = TestDomainEvent | OtherDomainEvent;

const makeEvent = <TType extends AnyTestEvent["type"]>(
  type: TType,
  tags: Tag[],
): AnyTestEvent => ({
  type,
  payload: { name: "Elon Musk" },
  kind: "domain",
  tags,
  commandId: randomUUID(),
  commandType: "TestDomainEventCommand",
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
}) as AnyTestEvent;

const subjectTag = (value: string): Tag => ({ key: "subject", value });
const queryFor = (criteria: DcbQuery["criteria"]): DcbQuery => ({ criteria });

describe("in-memory event store", () => {
  let eventStore: ReadEvents<AnyTestEvent> &
    LoadEventsFrom<AnyTestEvent> &
    AppendToEventStream<AnyTestEvent, Promise<void | GatewayFailure | AppendConflict>> &
    SimulateFaults;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
  });

  it("should be defined", () => {
    expect(InMemoryEventStore).toBeDefined();
  });

  describe("read", () => {
    it("returns events matching a tag criterion with the store-wide position", async () => {
      const id = randomUUID();
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])]);
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(randomUUID())])]);

      const result = (await eventStore.read(
        queryFor([{ tags: [subjectTag(id)] }]),
      )) as ReadResult<AnyTestEvent>;

      expect(result.events).toHaveLength(1);
      expect(result.position).toBe(2);
    });

    it("filters by event type within a criterion", async () => {
      const id = randomUUID();
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])]);
      await eventStore.append([makeEvent("OtherDomainEvent", [subjectTag(id)])]);

      const result = (await eventStore.read(
        queryFor([{ types: ["OtherDomainEvent"], tags: [subjectTag(id)] }]),
      )) as ReadResult<AnyTestEvent>;

      expect(result.events.map((event) => event.type)).toEqual(["OtherDomainEvent"]);
    });

    it("requires every tag in a criterion to be present (AND)", async () => {
      const id = randomUUID();
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])]);
      await eventStore.append([
        makeEvent("TestDomainEvent", [subjectTag(id), { key: "tenant", value: "acme" }]),
      ]);

      const result = (await eventStore.read(
        queryFor([{ tags: [subjectTag(id), { key: "tenant", value: "acme" }] }]),
      )) as ReadResult<AnyTestEvent>;

      expect(result.events).toHaveLength(1);
    });

    it("matches an event against any criterion (OR)", async () => {
      const a = randomUUID();
      const b = randomUUID();
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(a)])]);
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(b)])]);

      const result = (await eventStore.read(
        queryFor([{ tags: [subjectTag(a)] }, { tags: [subjectTag(b)] }]),
      )) as ReadResult<AnyTestEvent>;

      expect(result.events).toHaveLength(2);
    });

    it("matches no events for an empty criteria list", async () => {
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(randomUUID())])]);

      const result = (await eventStore.read(queryFor([]))) as ReadResult<AnyTestEvent>;

      expect(result.events).toEqual([]);
      expect(result.position).toBe(1);
    });

    it("returns a GatewayFailure when offline", async () => {
      eventStore.simulate("offline");
      const result = await eventStore.read(queryFor([{ tags: [subjectTag("x")] }]));
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" });
    });
  });

  describe("loadFrom", () => {
    const fixture = [
      makeEvent("TestDomainEvent", [subjectTag(randomUUID())]),
      makeEvent("TestDomainEvent", [subjectTag(randomUUID())]),
      makeEvent("TestDomainEvent", [subjectTag(randomUUID())]),
    ];

    it("returns all stored events from globalPosition 1", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(1)) as StoredEvent<AnyTestEvent>[];
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2, 3]);
      expect(result.map((row) => row.event)).toEqual(fixture);
    });

    it("filters out rows before the given globalPosition", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(2)) as StoredEvent<AnyTestEvent>[];
      expect(result.map((row) => row.globalPosition)).toEqual([2, 3]);
    });

    it("honours the optional limit", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(1, 2)) as StoredEvent<AnyTestEvent>[];
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2]);
    });

    it("returns an empty array when nothing has been appended", async () => {
      const result = await eventStore.loadFrom(1);
      expect(result).toEqual([]);
    });

    it("returns a GatewayFailure when offline", async () => {
      eventStore.simulate("offline");
      const result = await eventStore.loadFrom(1);
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" });
    });
  });

  describe("append", () => {
    it("appends without a condition", async () => {
      const event = makeEvent("TestDomainEvent", [subjectTag(randomUUID())]);
      await expect(eventStore.append([event])).resolves.toBeUndefined();
    });

    it("succeeds with a condition when no matching event was stored after the position", async () => {
      const id = randomUUID();
      const query = queryFor([{ types: ["TestDomainEvent"], tags: [subjectTag(id)] }]);

      const result = await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])], {
        query,
        after: 0,
      });

      expect(result).toBeUndefined();
    });

    it("does not conflict on an unrelated event stored after the position", async () => {
      const id = randomUUID();
      const query = queryFor([{ types: ["TestDomainEvent"], tags: [subjectTag(id)] }]);
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(randomUUID())])]);

      const result = await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])], {
        query,
        after: 0,
      });

      expect(result).toBeUndefined();
    });

    it("returns an AppendConflict when a matching event was stored after the position", async () => {
      const id = randomUUID();
      const query = queryFor([{ types: ["TestDomainEvent"], tags: [subjectTag(id)] }]);
      await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])]);

      const result = await eventStore.append([makeEvent("TestDomainEvent", [subjectTag(id)])], {
        query,
        after: 0,
      });

      expect(result).toMatchObject({ kind: "failure", code: "APPEND_CONDITION_FAILED" });
    });

    it("returns a GatewayFailure when offline", async () => {
      eventStore.simulate("offline");
      const event = makeEvent("TestDomainEvent", [subjectTag(randomUUID())]);
      const result = await eventStore.append([event]);
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" });
    });
  });

  describe("simulate", () => {
    it("exposes isSimulating and the active fault, then restores", async () => {
      eventStore.simulate("offline");
      expect(eventStore.isSimulating).toBe(true);
      expect(eventStore.activeFault).toBe("offline");

      eventStore.restore();
      expect(eventStore.isSimulating).toBe(false);
      expect(eventStore.activeFault).toBeUndefined();
    });
  });
});
