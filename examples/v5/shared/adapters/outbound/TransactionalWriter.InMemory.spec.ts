import { InMemoryTransactionalWriter } from "./TransactionalWriter.InMemory.ts";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";
import { InMemoryOutbox } from "./Outbox.InMemory.ts";
import type { DomainEvent, Intent } from "@arts-and-crafts/v5/core/shapes";
import type { StreamKey } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { randomUUID } from "node:crypto";

interface TestDomainEvent extends DomainEvent<"TestDomainEvent", { name: string }> {}
interface TestIntent extends Intent<"TestIntent", { channel: "email" }> {}

const streamKey: StreamKey = "seat#1";

const makeEvent = (): TestDomainEvent => ({
  type: "TestDomainEvent",
  payload: { name: "Elon Musk" },
  concerns: [streamKey],
  kind: "domain",
  commandId: randomUUID(),
  commandType: "TestCommand",
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
});

const makeIntent = (): TestIntent => ({
  kind: "intent",
  type: "TestIntent",
  payload: { channel: "email" },
  commandId: randomUUID(),
  commandType: "TestCommand",
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
});

describe("InMemoryTransactionalWriter", () => {
  let eventStore: InMemoryEventStore<TestDomainEvent>;
  let outbox: InMemoryOutbox<TestIntent, never>;
  let writer: InMemoryTransactionalWriter<TestDomainEvent, TestIntent>;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<TestDomainEvent>();
    outbox = new InMemoryOutbox<TestIntent, never>();
    writer = new InMemoryTransactionalWriter(eventStore, outbox);
  });

  it("persists both the event and the intent on success", async () => {
    const event = makeEvent();
    const intent = makeIntent();

    await writer.appendEventsAndIntents([event], [intent]);

    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
    const pending = (await outbox.loadPending())._unsafeUnwrap();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.entry).toEqual(intent);
  });

  it("persists neither the event nor the intent when the event store is offline", async () => {
    eventStore.simulate("offline");

    const result = await writer.appendEventsAndIntents([makeEvent()], [makeIntent()]);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryTransactionalWriter",
    });
    eventStore.restore();
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);
    expect((await outbox.loadPending())._unsafeUnwrap()).toEqual([]);
  });

  it("persists neither the event nor the intent when the outbox is offline", async () => {
    outbox.simulate("offline");

    const result = await writer.appendEventsAndIntents([makeEvent()], [makeIntent()]);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryTransactionalWriter",
    });
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);
    outbox.restore();
    expect((await outbox.loadPending())._unsafeUnwrap()).toEqual([]);
  });

  it("reports simulating and the active fault from either underlying store", () => {
    expect(writer.isSimulating).toBe(false);

    eventStore.simulate("offline");
    expect(writer.isSimulating).toBe(true);
    expect(writer.activeFault).toBe("offline");
    eventStore.restore();

    outbox.simulate("offline");
    expect(writer.isSimulating).toBe(true);
    expect(writer.activeFault).toBe("offline");
    outbox.restore();
    expect(writer.isSimulating).toBe(false);
  });

  it("simulate/restore on the writer take down and bring back both stores", async () => {
    writer.simulate("offline");
    expect(eventStore.isSimulating).toBe(true);
    expect(outbox.isSimulating).toBe(true);

    writer.restore();
    expect(eventStore.isSimulating).toBe(false);
    expect(outbox.isSimulating).toBe(false);

    const event = makeEvent();
    const intent = makeIntent();
    await writer.appendEventsAndIntents([event], [intent]);
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
  });
});
