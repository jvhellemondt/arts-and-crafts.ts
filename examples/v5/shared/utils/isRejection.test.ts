import type { Accepted, Rejected } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { DomainEvent, Intent, Rejection } from "@arts-and-crafts/v5/core/shapes";
import { isRejection } from "./isRejection.ts";
import { createStreamKey } from "./createStreamKey.ts";

interface TestEvent extends DomainEvent<"TestEvent", { value: string }> {}
interface TestIntent extends Intent<"TestIntent", { value: string }> {}
interface TestRejection extends Rejection<"TEST_REJECTED"> {}

const accepted: Accepted<TestEvent, TestIntent> = {
  accepted: true,
  events: [
    {
      type: "TestEvent",
      kind: "domain",
      concerns: [createStreamKey("Test", "10")],
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
