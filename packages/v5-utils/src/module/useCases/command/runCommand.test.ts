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

function createTestCommand(payload: TestCommandPayload, metadata: Metadata): TestCommand {
  return {
    id: "cmd-1",
    type: "TestCommand",
    kind: "command",
    payload,
    metadata,
    timestamp: Date.now(),
  };
}

const METADATA: Metadata = { correlationId: "c1", causationId: "ca1" };

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
  it("returns the constructed command on success (empty failures array)", async () => {
    const handler = handlerReturning([]);
    const command = await runCommand(createTestCommand, handler)({ name: "John" }, METADATA);
    expect(command.payload).toEqual({ name: "John" });
    expect(command.metadata).toBe(METADATA);
  });

  it("throws a RejectionError wrapping the rejection", async () => {
    const handler = handlerReturning(REJECTION);
    await expect(
      runCommand(createTestCommand, handler)({ name: "John" }, METADATA),
    ).rejects.toThrow(RejectionError);
  });

  it("throws a FailureError wrapping the failures", async () => {
    const handler = handlerReturning([FAILURE]);
    const run = runCommand(createTestCommand, handler)({ name: "John" }, METADATA);
    await expect(run).rejects.toThrow(FailureError);
  });
});
