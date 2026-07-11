import type { HandleIntent } from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type { Intent } from "@arts-and-crafts/v5/core/shapes";
import type {
  LoadPendingIntents,
  MarkIntentDispatched,
  MarkIntentFailed,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { OutboxEnvelope, GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { IntentRelay } from "./IntentRelay.ts";
import { randomUUID } from "node:crypto";

interface NotifyIntent extends Intent<"Notify.v1", { channel: "email" | "push" }> {}
interface WelcomeIntent extends Intent<"Welcome.v1", { name: string }> {}

type TestIntent = NotifyIntent | WelcomeIntent;

const makeNotify = (channel: "email" | "push" = "email"): NotifyIntent => ({
  kind: "intent",
  type: "Notify.v1",
  id: randomUUID(),
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { channel },
  commandType: "RegisterMembership",
  commandId: randomUUID(),
});

const makeWelcome = (name = "Jane"): WelcomeIntent => ({
  kind: "intent",
  type: "Welcome.v1",
  id: randomUUID(),
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { name },
  commandType: "RegisterMembership",
  commandId: randomUUID(),
});

class RecordingHandler<T extends Intent> implements HandleIntent<T> {
  public readonly received: T[] = [];
  constructor(private readonly behavior: (input: T) => Promise<void> = async () => undefined) {}
  async handle(input: T): Promise<void> {
    this.received.push(input);
    await this.behavior(input);
  }
}

describe("IntentRelay", () => {
  let datasource: Map<string, OutboxEnvelope<TestIntent>[]>;
  let outbox: InMemoryOutbox<TestIntent, never>;

  beforeEach(() => {
    datasource = new Map();
    outbox = new InMemoryOutbox<TestIntent, never>(datasource);
  });

  it("should resolve and call no handlers when the outbox is empty", async () => {
    const notify = new RecordingHandler<NotifyIntent>();
    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
      ]),
    );

    await relay.relay();

    expect(notify.received).toEqual([]);
  });

  it("should route each pending envelope to the handler matching its type", async () => {
    const notify = new RecordingHandler<NotifyIntent>();
    const welcome = new RecordingHandler<WelcomeIntent>();
    const n = makeNotify();
    const w = makeWelcome();
    await outbox.stage([n, w]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
        ["Welcome.v1", welcome as HandleIntent<TestIntent>],
      ]),
    );

    await relay.relay();

    expect(notify.received).toEqual([n]);
    expect(welcome.received).toEqual([w]);
  });

  it("should mark envelopes dispatched after a successful handler", async () => {
    const notify = new RecordingHandler<NotifyIntent>();
    const n = makeNotify();
    await outbox.stage([n]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
      ]),
    );
    await relay.relay();

    const row = datasource.get("outbox")?.find((r) => r.entry.id === n.id);
    expect(row?.status).toBe("dispatched");
    expect(row?.dispatchedAt).toBeDefined();
  });

  it("should mark an envelope failed with the thrown Error message", async () => {
    const failing = new RecordingHandler<NotifyIntent>(async () => {
      throw new Error("smtp down");
    });
    const n = makeNotify();
    await outbox.stage([n]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", failing as HandleIntent<TestIntent>],
      ]),
    );
    await relay.relay();

    const row = datasource.get("outbox")?.find((r) => r.entry.id === n.id);
    expect(row?.status).toBe("failed");
    expect(row?.lastError).toBe("smtp down");
    expect(row?.attemptCount).toBe(1);
  });

  it("should stringify non-Error throws", async () => {
    const failing = new RecordingHandler<NotifyIntent>(async () => {
      throw "oops";
    });
    const n = makeNotify();
    await outbox.stage([n]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", failing as HandleIntent<TestIntent>],
      ]),
    );
    await relay.relay();

    const row = datasource.get("outbox")?.find((r) => r.entry.id === n.id);
    expect(row?.lastError).toBe("oops");
  });

  it("should mark an envelope failed when no handler is registered for its type", async () => {
    const w = makeWelcome();
    await outbox.stage([w]);

    const relay = new IntentRelay<TestIntent>(outbox, new Map<string, HandleIntent<TestIntent>>());
    await relay.relay();

    const row = datasource.get("outbox")?.find((r) => r.entry.id === w.id);
    expect(row?.status).toBe("failed");
    expect(row?.lastError).toContain("Welcome.v1");
  });

  it("should resolve without invoking handlers when loadPending returns a GatewayFailure", async () => {
    const notify = new RecordingHandler<NotifyIntent>();
    await outbox.stage([makeNotify()]);
    outbox.simulate("offline");

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
      ]),
    );

    await expect(relay.relay()).resolves.toBeUndefined();
    expect(notify.received).toEqual([]);
  });

  it("should not re-dispatch already-dispatched envelopes on a second relay call", async () => {
    const notify = new RecordingHandler<NotifyIntent>();
    await outbox.stage([makeNotify()]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
      ]),
    );

    await relay.relay();
    await relay.relay();

    expect(notify.received).toHaveLength(1);
  });

  it("should tolerate markDispatched returning a GatewayFailure", async () => {
    const offlineFailure: GatewayFailure = {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "FakeOutbox",
      reason: "boom",
    };
    const envelope: OutboxEnvelope<NotifyIntent> = {
      status: "pending",
      stagedAt: Date.now(),
      attemptCount: 0,
      entry: makeNotify(),
    };
    const fakeOutbox: LoadPendingIntents<TestIntent> & MarkIntentDispatched & MarkIntentFailed = {
      loadPending: async () => [envelope],
      markDispatched: async () => offlineFailure,
      markFailed: async () => undefined,
    };

    const notify = new RecordingHandler<NotifyIntent>();
    const relay = new IntentRelay<TestIntent>(
      fakeOutbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", notify as HandleIntent<TestIntent>],
      ]),
    );

    await expect(relay.relay()).resolves.toBeUndefined();
    expect(notify.received).toHaveLength(1);
  });

  it("should tolerate markFailed returning a GatewayFailure", async () => {
    const envelope: OutboxEnvelope<NotifyIntent> = {
      status: "pending",
      stagedAt: Date.now(),
      attemptCount: 0,
      entry: makeNotify(),
    };
    const fakeOutbox: LoadPendingIntents<TestIntent> & MarkIntentDispatched & MarkIntentFailed = {
      loadPending: async () => [envelope],
      markDispatched: async () => undefined,
      markFailed: async () => ({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "FakeOutbox",
        reason: "boom",
      }),
    };

    const failing = new RecordingHandler<NotifyIntent>(async () => {
      throw new Error("nope");
    });
    const relay = new IntentRelay<TestIntent>(
      fakeOutbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", failing as HandleIntent<TestIntent>],
      ]),
    );

    await expect(relay.relay()).resolves.toBeUndefined();
  });

  it("should continue processing remaining envelopes after one throws", async () => {
    const failing = new RecordingHandler<NotifyIntent>(async () => {
      throw new Error("first fails");
    });
    const succeeding = new RecordingHandler<WelcomeIntent>();
    const n = makeNotify();
    const w = makeWelcome();
    await outbox.stage([n, w]);

    const relay = new IntentRelay<TestIntent>(
      outbox,
      new Map<string, HandleIntent<TestIntent>>([
        ["Notify.v1", failing as HandleIntent<TestIntent>],
        ["Welcome.v1", succeeding as HandleIntent<TestIntent>],
      ]),
    );

    await relay.relay();

    const rows = datasource.get("outbox") ?? [];
    expect(rows.find((r) => r.entry.id === n.id)?.status).toBe("failed");
    expect(rows.find((r) => r.entry.id === w.id)?.status).toBe("dispatched");
    expect(succeeding.received).toEqual([w]);
  });
});
