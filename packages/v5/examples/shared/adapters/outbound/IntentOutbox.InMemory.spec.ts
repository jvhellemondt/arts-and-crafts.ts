import type { StagesIntents } from "@adapters/outbound/capabilities/StagesIntents.ts";
import { InMemoryIntentOutbox } from "./IntentOutbox.InMemory.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import { randomUUID } from "node:crypto";

interface TestNotificationIntent extends Intent<"NotifyUser", { channel: "email" | "push" }> {}

describe("in-memory intent outbox", () => {
  let datasource: Map<string, TestNotificationIntent[]>;
  let outbox: StagesIntents<TestNotificationIntent>;
  const fixture: TestNotificationIntent[] = [
    {
      kind: "intent",
      type: "NotifyUser",
      payload: {
        channel: "email",
      },
      timestamp: new Date().getTime(),
      metadata: {
        correlationId: randomUUID(),
        causationId: randomUUID(),
      },
      id: randomUUID(),
    },
    {
      kind: "intent",
      type: "NotifyUser",
      payload: {
        channel: "push",
      },
      timestamp: new Date().getTime(),
      metadata: {
        correlationId: randomUUID(),
        causationId: randomUUID(),
      },
      id: randomUUID(),
    },
    {
      kind: "intent",
      type: "NotifyUser",
      payload: {
        channel: "push",
      },
      timestamp: new Date().getTime(),
      metadata: {
        correlationId: randomUUID(),
        causationId: randomUUID(),
      },
      id: randomUUID(),
    },
  ];

  beforeEach(() => {
    datasource = new Map<string, TestNotificationIntent[]>();
    outbox = new InMemoryIntentOutbox<TestNotificationIntent>(datasource);
  });

  it("should be defined", () => {
    expect(InMemoryIntentOutbox).toBeDefined();
  });

  it("should construct without arguments", () => {
    expect(new InMemoryIntentOutbox<TestNotificationIntent>()).toBeDefined();
  });

  it("should use the table if it were already created", async () => {
    datasource.set("intent_outbox", [
      {
        kind: "intent",
        type: "NotifyUser",
        payload: {
          channel: "email",
        },
        timestamp: new Date().getTime(),
        metadata: {
          correlationId: randomUUID(),
          causationId: randomUUID(),
        },
        id: randomUUID(),
      },
    ]);
    outbox = new InMemoryIntentOutbox<TestNotificationIntent>(datasource);
    await outbox.stage(fixture);
    expect(datasource.get("intent_outbox")).toHaveLength(fixture.length + 1);
  });

  it("should stage intents", async () => {
    await outbox.stage(fixture);
    expect(datasource.get("intent_outbox")).toEqual(fixture);
    expect(datasource.get("intent_outbox")).toHaveLength(fixture.length);
  });
});
