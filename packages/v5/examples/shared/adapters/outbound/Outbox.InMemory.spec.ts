import { InMemoryIntentOutbox } from "./Outbox.InMemory.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import { randomUUID } from "node:crypto";

interface TestNotificationIntent extends Intent<"NotifyUser", { channel: "email" | "push" }> {}

const makeIntent = (channel: "email" | "push"): TestNotificationIntent => ({
  kind: "intent",
  type: "NotifyUser",
  payload: { channel },
  timestamp: Date.now(),
  metadata: {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  },
  id: randomUUID(),
});

describe("in-memory intent outbox", () => {
  let datasource: Map<string, OutboxEnvelope<TestNotificationIntent>[]>;
  let outbox: InMemoryIntentOutbox<TestNotificationIntent>;

  const fixture: TestNotificationIntent[] = [
    makeIntent("email"),
    makeIntent("push"),
    makeIntent("push"),
  ];

  beforeEach(() => {
    datasource = new Map();
    outbox = new InMemoryIntentOutbox<TestNotificationIntent>(datasource);
  });

  it("should be defined", () => {
    expect(InMemoryIntentOutbox).toBeDefined();
  });

  it("should construct without arguments", () => {
    expect(new InMemoryIntentOutbox<TestNotificationIntent>()).toBeDefined();
  });

  it("should use the table if it were already created", async () => {
    const existing: OutboxEnvelope<TestNotificationIntent> = {
      status: "pending",
      stagedAt: Date.now(),
      entry: makeIntent("email"),
    };
    datasource.set("intent_outbox", [existing]);
    outbox = new InMemoryIntentOutbox<TestNotificationIntent>(datasource);

    await outbox.stage(fixture);

    expect(datasource.get("intent_outbox")).toHaveLength(fixture.length + 1);
  });

  it("should stage intents as pending envelopes", async () => {
    await outbox.stage(fixture);

    const rows = datasource.get("intent_outbox");
    expect(rows).toHaveLength(fixture.length);
    expect(rows?.every((r) => r.status === "pending")).toBe(true);
    expect(rows?.map((r) => r.entry)).toEqual(fixture);
  });

  describe("should simulate offline fault", async () => {
    beforeEach(() => {
      outbox.simulate("offline");
    });

    it("should expose isSimulating property as true", () => {
      expect(outbox.isSimulating).toBe(true);
    });

    it("should yield a gateway failure for each intent", async () => {
      const result = await outbox.stage(fixture);
      expect(result?.kind === "GatewayFailure").toBe(true);
    });

    it("should restore the outbox to online state", async () => {
      outbox.restore();
      expect(outbox.isSimulating).toBe(false);
      await outbox.stage(fixture);
      expect(datasource.get("intent_outbox")).toHaveLength(fixture.length);
    });
  });
});
