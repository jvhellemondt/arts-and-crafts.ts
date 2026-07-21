import { InMemoryTransactionalWriter } from "./TransactionalWriter.InMemory.ts";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";
import { InMemoryOutbox } from "./Outbox.InMemory.ts";
import { InMemoryDatasource } from "./InMemoryDatasource.ts";
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
  let datasource: InMemoryDatasource;
  let eventStore: InMemoryEventStore<TestDomainEvent>;
  let outbox: InMemoryOutbox<TestIntent, never>;
  let writer: InMemoryTransactionalWriter<TestDomainEvent, TestIntent>;

  beforeEach(() => {
    datasource = new InMemoryDatasource();
    eventStore = new InMemoryEventStore<TestDomainEvent>(datasource);
    outbox = new InMemoryOutbox<TestIntent, never>(datasource);
    writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);
  });

  it("persists both the event and the intent on success", async () => {
    const event = makeEvent();
    const intent = makeIntent();

    await writer.persist({ events: [event], intents: [intent] });

    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
    const pending = (await outbox.loadPending())._unsafeUnwrap();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.entry).toEqual(intent);
  });

  it("commits immediately when writing outside of a transaction (autocommit default)", async () => {
    const event = makeEvent();

    await eventStore.append([event]);

    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
  });

  it("stages an append but does not make it visible until commit(), once a transaction is open", async () => {
    const event = makeEvent();

    datasource.begin();
    await eventStore.append([event]);
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);

    datasource.commit();
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
  });

  it("persists neither the event nor the intent when the event store is offline", async () => {
    eventStore.simulate("offline");

    const result = await writer.persist({ events: [makeEvent()], intents: [makeIntent()] });

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryEventStore",
    });
    eventStore.restore();
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);
    expect((await outbox.loadPending())._unsafeUnwrap()).toEqual([]);
  });

  it("persists neither the event nor the intent when the outbox is offline", async () => {
    outbox.simulate("offline");

    const result = await writer.persist({ events: [makeEvent()], intents: [makeIntent()] });

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryIntentOutbox",
    });
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);
    outbox.restore();
    expect((await outbox.loadPending())._unsafeUnwrap()).toEqual([]);
  });

  it("rolls back a successfully-staged event write when the intent write fails (real rollback, not a pre-flight guess)", async () => {
    const event = makeEvent();

    // The event store write itself succeeds and stages fine — it is not
    // offline. Only the outbox is. Proves the writer's rollback discards a
    // write that already succeeded, rather than relying on a single upfront
    // flag that predicts failure before either write is attempted.
    outbox.simulate("offline");
    const result = await writer.persist({ events: [event], intents: [makeIntent()] });

    expect(result.isErr()).toBe(true);
    outbox.restore();
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([]);
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
    await writer.persist({ events: [event], intents: [intent] });
    expect((await eventStore.load([streamKey]))._unsafeUnwrap()).toEqual([event]);
  });
});
