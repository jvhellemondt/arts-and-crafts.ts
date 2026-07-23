import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import { randomUUID } from "node:crypto";
import { toRejectionNotification } from "./toRejectionNotification.ts";

interface TestCommand extends Command<"TestCommand", { name: string }> {}
interface TestRejection extends Rejection<"TEST_REJECTED"> {
  reason: "Test rejected";
}
interface TestNotification extends Notification<
  "TestCommandRejected",
  { name: string },
  "TEST_REJECTED"
> {}

describe("toRejectionNotification", () => {
  const command: TestCommand = {
    kind: "command",
    type: "TestCommand",
    payload: { name: "Elon Musk" },
    timestamp: Date.now(),
    metadata: { correlationId: randomUUID(), causationId: randomUUID() },
    id: randomUUID(),
  };

  const rejection: TestRejection = {
    kind: "rejection",
    code: "TEST_REJECTED",
    reason: "Test rejected",
  };

  it("derives the notification type from the command type", () => {
    const notification = toRejectionNotification<TestNotification>(command, rejection);
    expect(notification.type).toBe("TestCommandRejected");
  });

  it("carries the command's payload and metadata", () => {
    const notification = toRejectionNotification<TestNotification>(command, rejection);
    expect(notification.payload).toEqual(command.payload);
    expect(notification.metadata).toEqual(command.metadata);
  });

  it("carries the command's id and type as commandId/commandType", () => {
    const notification = toRejectionNotification<TestNotification>(command, rejection);
    expect(notification.commandId).toBe(command.id);
    expect(notification.commandType).toBe(command.type);
  });

  it("carries the rejection as details", () => {
    const notification = toRejectionNotification<TestNotification>(command, rejection);
    expect(notification.details).toEqual(rejection);
  });

  it("stamps kind as notification and a fresh id/timestamp", () => {
    const notification = toRejectionNotification<TestNotification>(command, rejection);
    expect(notification.kind).toBe("notification");
    expect(typeof notification.id).toBe("string");
    expect(notification.id).not.toBe(command.id);
    expect(typeof notification.timestamp).toBe("number");
  });
});
