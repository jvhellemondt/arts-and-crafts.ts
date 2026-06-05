import { InMemoryOutbox } from "./Outbox.InMemory.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import { randomUUID } from "node:crypto";
import { MEMBERSHIP_AGGREGATE } from "@examples/modules/membership/core/state.ts";
import { OPEN_MEMBERSHIP } from "@examples/modules/membership/useCases/commands/openMembership/command.ts";

interface TestIntent extends Intent<"NotifyUser", { channel: "email" | "push" }> {}
interface TestNotification extends Notification<
  "MembershipOpeningRejected",
  object,
  "MembershipOpeningRejected"
> {}

const makeIntent = (channel: "email" | "push"): TestIntent => ({
  kind: "intent",
  type: "NotifyUser",
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
  payload: { channel },
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
  aggregateType: MEMBERSHIP_AGGREGATE,
  aggregateId: randomUUID(),
});

const makeNotification = (reason: string): TestNotification => ({
  kind: "rejection",
  type: "MembershipOpeningRejected",
  payload: { reason },
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  id: randomUUID(),
  details: {
    kind: "rejection",
    code: "MembershipOpeningRejected",
    reason: "Invalid",
  },
  commandType: OPEN_MEMBERSHIP,
  commandId: randomUUID(),
  aggregateType: MEMBERSHIP_AGGREGATE,
  aggregateId: randomUUID(),
});

describe("InMemoryIntentOutbox", () => {
  let datasource: Map<string, OutboxEnvelope<TestIntent | TestNotification>[]>;
  let outbox: InMemoryOutbox<TestIntent, TestNotification>;

  const intentFixture: TestIntent[] = [makeIntent("email"), makeIntent("push"), makeIntent("push")];
  const notificationFixture: TestNotification[] = [
    makeNotification("already exists"),
    makeNotification("invalid email"),
  ];

  beforeEach(() => {
    datasource = new Map();
    outbox = new InMemoryOutbox<TestIntent, TestNotification>(datasource);
  });

  it("should be defined", () => {
    expect(InMemoryOutbox).toBeDefined();
  });

  it("should construct without arguments", () => {
    expect(new InMemoryOutbox()).toBeDefined();
  });

  it("should use the table if it were already created", async () => {
    const existing: OutboxEnvelope<TestIntent> = {
      status: "pending",
      stagedAt: Date.now(),
      attemptCount: 0,
      entry: makeIntent("email"),
    };
    datasource.set("outbox", [existing]);
    outbox = new InMemoryOutbox<TestIntent, TestNotification>(datasource);

    await outbox.stage(intentFixture);

    expect(datasource.get("outbox")).toHaveLength(intentFixture.length + 1);
  });

  describe("staging intents", () => {
    it("should stage intents as pending envelopes", async () => {
      await outbox.stage(intentFixture);

      const rows = datasource.get("outbox");
      expect(rows).toHaveLength(intentFixture.length);
      expect(rows?.every((r) => r.status === "pending")).toBe(true);
      expect(rows?.map((r) => r.entry)).toEqual(intentFixture);
    });

    it("should stage intents with attemptCount of 0 and no dispatched/failed metadata", async () => {
      await outbox.stage(intentFixture);

      const rows = datasource.get("outbox");
      expect(rows?.every((r) => r.attemptCount === 0)).toBe(true);
      expect(rows?.every((r) => r.dispatchedAt === undefined)).toBe(true);
      expect(rows?.every((r) => r.failedAt === undefined)).toBe(true);
      expect(rows?.every((r) => r.lastError === undefined)).toBe(true);
    });
  });

  describe("staging notifications", () => {
    it("should stage notifications as pending envelopes", async () => {
      await outbox.stage(notificationFixture);

      const rows = datasource.get("outbox");
      expect(rows).toHaveLength(notificationFixture.length);
      expect(rows?.every((r) => r.status === "pending")).toBe(true);
      expect(rows?.map((r) => r.entry)).toEqual(notificationFixture);
    });

    it("should stage intents and notifications to the same table", async () => {
      await outbox.stage(intentFixture);
      await outbox.stage(notificationFixture);

      expect(datasource.get("outbox")).toHaveLength(
        intentFixture.length + notificationFixture.length,
      );
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
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE" });
    });

    it("should return a GatewayFailure when staging notifications", async () => {
      const result = await outbox.stage(notificationFixture);
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE" });
    });

    it("should not stage any entries while offline", async () => {
      await outbox.stage(intentFixture);
      await outbox.stage(notificationFixture);

      expect(datasource.get("outbox")).toBeUndefined();
    });

    it("should restore to online state", async () => {
      outbox.restore();

      expect(outbox.isSimulating).toBe(false);
      await outbox.stage(intentFixture);
      expect(datasource.get("outbox")).toHaveLength(intentFixture.length);
    });
  });

  describe("loadPending", () => {
    it("should return an empty array when nothing is staged", async () => {
      const result = await outbox.loadPending();
      expect(result).toEqual([]);
    });

    it("should return only pending intent envelopes", async () => {
      await outbox.stage(intentFixture);
      await outbox.stage(notificationFixture);

      const result = await outbox.loadPending();

      expect(Array.isArray(result)).toBe(true);
      const envelopes = result as OutboxEnvelope<TestIntent>[];
      expect(envelopes).toHaveLength(intentFixture.length);
      expect(envelopes.every((e) => e.entry.kind === "intent")).toBe(true);
      expect(envelopes.every((e) => e.status === "pending")).toBe(true);
    });

    it("should exclude dispatched and failed envelopes", async () => {
      await outbox.stage(intentFixture);
      const [first, second] = intentFixture;
      await outbox.markDispatched(first.id);
      await outbox.markFailed(second.id, "transient");

      const result = (await outbox.loadPending()) as OutboxEnvelope<TestIntent>[];

      expect(result).toHaveLength(intentFixture.length - 2);
      expect(result.every((e) => e.entry.id !== first.id)).toBe(true);
      expect(result.every((e) => e.entry.id !== second.id)).toBe(true);
    });

    it("should honor the limit argument", async () => {
      await outbox.stage(intentFixture);
      const result = (await outbox.loadPending(2)) as OutboxEnvelope<TestIntent>[];
      expect(result).toHaveLength(2);
    });

    it("should return a GatewayFailure when offline", async () => {
      outbox.simulate("offline");
      const result = await outbox.loadPending();
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" });
    });
  });

  describe("markDispatched", () => {
    it("should transition a pending envelope to dispatched with a timestamp", async () => {
      await outbox.stage(intentFixture);
      const target = intentFixture[0];

      const before = Date.now();
      const result = await outbox.markDispatched(target.id);

      expect(result).toBeUndefined();
      const row = datasource.get("outbox")?.find((r) => r.entry.id === target.id);
      expect(row?.status).toBe("dispatched");
      expect(row?.dispatchedAt).toBeGreaterThanOrEqual(before);
    });

    it("should return a GatewayFailure for an unknown id", async () => {
      const result = await outbox.markDispatched("does-not-exist");
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: expect.stringContaining("does-not-exist"),
      });
    });

    it("should return a GatewayFailure when offline", async () => {
      outbox.simulate("offline");
      const result = await outbox.markDispatched("any-id");
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" });
    });
  });

  describe("markFailed", () => {
    it("should mark an envelope failed and record reason, failedAt, and incremented attemptCount", async () => {
      await outbox.stage(intentFixture);
      const target = intentFixture[0];

      const before = Date.now();
      const result = await outbox.markFailed(target.id, "smtp down");

      expect(result).toBeUndefined();
      const row = datasource.get("outbox")?.find((r) => r.entry.id === target.id);
      expect(row?.status).toBe("failed");
      expect(row?.lastError).toBe("smtp down");
      expect(row?.failedAt).toBeGreaterThanOrEqual(before);
      expect(row?.attemptCount).toBe(1);
    });

    it("should accumulate attemptCount across repeated failures", async () => {
      await outbox.stage(intentFixture);
      const target = intentFixture[0];

      await outbox.markFailed(target.id, "first");
      await outbox.markFailed(target.id, "second");

      const row = datasource.get("outbox")?.find((r) => r.entry.id === target.id);
      expect(row?.attemptCount).toBe(2);
      expect(row?.lastError).toBe("second");
    });

    it("should return a GatewayFailure for an unknown id", async () => {
      const result = await outbox.markFailed("does-not-exist", "nope");
      expect(result).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryIntentOutbox",
        reason: expect.stringContaining("does-not-exist"),
      });
    });

    it("should return a GatewayFailure when offline", async () => {
      outbox.simulate("offline");
      const result = await outbox.markFailed("any-id", "nope");
      expect(result).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" });
    });
  });
});
