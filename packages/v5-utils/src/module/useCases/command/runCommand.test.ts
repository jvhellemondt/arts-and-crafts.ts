import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection, Metadata } from "@arts-and-crafts/v5/core/shapes";
import { runCommand } from "./runCommand.ts";
import { RejectionError } from "../../adapters/inbound/RejectionError.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

interface TestCommandPayload {
  name: string;
}

type TestCommand = Command<"TestCommand", TestCommandPayload>;

const METADATA: Metadata = { correlationId: "c1", causationId: "ca1" };

const TEST_COMMAND: TestCommand = {
  id: "cmd-1",
  type: "TestCommand",
  kind: "command",
  payload: { name: "John" },
  metadata: METADATA,
  timestamp: Date.now(),
};

const REJECTION: Rejection<"ALREADY_EXISTS"> = {
  kind: "rejection",
  code: "ALREADY_EXISTS",
  reason: "already exists",
};

const FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "TestGateway",
  reason: "boom",
};

function handlerReturning(
  result: GatewayFailure[] | Rejection,
): HandleCommand<TestCommand, Promise<GatewayFailure[] | Rejection>> {
  return { handle: async () => result };
}

describe("runCommand", () => {
  it("returns the command on success (empty failures array)", async () => {
    const handler = handlerReturning([]);
    const command = await runCommand(TEST_COMMAND, handler);
    expect(command).toBe(TEST_COMMAND);
  });

  it("throws a RejectionError wrapping the rejection", async () => {
    const handler = handlerReturning(REJECTION);
    await expect(runCommand(TEST_COMMAND, handler)).rejects.toThrow(RejectionError);
  });

  it("throws a FailureError wrapping the failures", async () => {
    const handler = handlerReturning([FAILURE]);
    await expect(runCommand(TEST_COMMAND, handler)).rejects.toThrow(FailureError);
  });
});
