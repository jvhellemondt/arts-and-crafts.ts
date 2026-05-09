import { InMemoryIntentOutbox } from "./Outbox.InMemory.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import { randomUUID } from "node:crypto";

interface TestIntent extends Intent<"NotifyUser", { channel: "email" | "push" }> {}
interface TestNotification extends Notification<"MembershipOpeningRejected", { reason: string }> {}

const makeIntent = (channel: "email" | "push"): TestIntent => ({
  kind: "intent",
  type: "NotifyUser",
  payload: { channel },
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
});

const makeNotification = (reason: string): TestNotification => ({
  kind: "notification",
  type: "MembershipOpeningRejected",
  payload: { reason },
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
});

describe("InMemoryIntentOutbox", () => {
  let datasource: Map<string, OutboxEnvelope<TestIntent | TestNotification>[]>;
  let outbox: InMemoryIntentOutbox<TestIntent, TestNotification>;

  const intentFixture: TestIntent[] = [makeIntent("email"), makeIntent("push"), makeIntent("push")];
  const notificationFixture: TestNotification[] = [makeNotification("already exists"), makeNotification("invalid email")];

  beforeEach(() => {
    datasource = new Map();
    outbox = new InMemoryIntentOutbox<TestIntent, TestNotification>(datasource);
  });

  it("should be defined", () => {
    expect(InMemoryIntentOutbox).toBeDefined();
  });

  it("should construct without arguments", () => {
    expect(new InMemoryIntentOutbox()).toBeDefined();
  });

  it("should use the table if it were already created", async () => {
    const existing: OutboxEnvelope<TestIntent> = {
      status: "pending",
      stagedAt: Date.now(),
      entry: makeIntent("email"),
    };
    datasource.set("intent_outbox", [existing]);
    outbox = new InMemoryIntentOutbox<TestIntent, TestNotification>(datasource);

    await outbox.stage(intentFixture);

    expect(datasource.get("intent_outbox")).toHaveLength(intentFixture.length + 1);
  });

  describe("staging intents", () => {
    it("should stage intents as pending envelopes", async () => {
      await outbox.stage(intentFixture);

      const rows = datasource.get("intent_outbox");
      expect(rows).toHaveLength(intentFixture.length);
      expect(rows?.every(r => r.status === "pending")).toBe(true);
      expect(rows?.map(r => r.entry)).toEqual(intentFixture);
    });
  });

  describe("staging notifications", () => {
    it("should stage notifications as pending envelopes", async () => {
      await outbox.stage(notificationFixture);

      const rows = datasource.get("intent_outbox");
      expect(rows).toHaveLength(notificationFixture.length);
      expect(rows?.every(r => r.status === "pending")).toBe(true);
      expect(rows?.map(r => r.entry)).toEqual(notificationFixture);
    });

    it("should stage intents and notifications to the same table", async () => {
      await outbox.stage(intentFixture);
      await outbox.stage(notificationFixture);

      expect(datasource.get("intent_outbox")).toHaveLength(intentFixture.length + notificationFixture.length);
    });
  });

  describe("simulating offline fault", () => {
    beforeEach(() => {
      outbox.simulate("offline");
    });

    it("should expose isSimulating as true", () => {
      expect(outbox.isSimulating).toBe(true);
    });

    it("should return a GatewayFailure when staging intents", async () => {
      const result = await outbox.stage(intentFixture);
      expect(result).toMatchObject({ kind: "GatewayFailure" });
    });

    it("should return a GatewayFailure when staging notifications", async () => {
      const result = await outbox.stage(notificationFixture);
      expect(result).toMatchObject({ kind: "GatewayFailure" });
    });

    it("should not stage any entries while offline", async () => {
      await outbox.stage(intentFixture);
      await outbox.stage(notificationFixture);

      expect(datasource.get("intent_outbox")).toBeUndefined();
    });

    it("should restore to online state", async () => {
      outbox.restore();

      expect(outbox.isSimulating).toBe(false);
      await outbox.stage(intentFixture);
      expect(datasource.get("intent_outbox")).toHaveLength(intentFixture.length);
    });
  });
});
