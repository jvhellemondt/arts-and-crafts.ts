import type { Accepted, Rejected } from "@useCases/command/shapes/Decision.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import { isRejection } from "./isRejection.ts";

interface TestEvent extends DomainEvent<"TestEvent", { value: string }> {}
interface TestIntent extends Intent<"TestIntent", { value: string }> {}
interface TestRejection extends Rejection<"TEST_REJECTED"> {}

const accepted: Accepted<TestEvent, TestIntent> = {
  accepted: true,
  events: [
    {
      type: "TestEvent",
      kind: "domain",
      aggregateType: "Test",
      aggregateId: "1",
      commandId: "1",
      commandType: "EventTest",
      id: "1",
      timestamp: Date.now(),
      metadata: { correlationId: "1", causationId: "1" },
      payload: { value: "test" },
    },
  ],
  intents: [],
};

const rejected: Rejected<TestRejection> = {
  accepted: false,
  rejection: { kind: "rejection", code: "TEST_REJECTED", reason: "Test rejection" },
};

describe("isRejection", () => {
  it("returns false for an accepted decision", () => {
    expect(isRejection(accepted)).toBe(false);
  });

  it("returns true for a rejected decision", () => {
    expect(isRejection(rejected)).toBe(true);
  });
});
