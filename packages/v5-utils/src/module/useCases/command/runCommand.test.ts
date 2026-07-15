import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection, Metadata } from "@arts-and-crafts/v5/core/shapes";
import { runCommand } from "./runCommand.ts";

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
  it("returns Ok with the command on success (empty failures array)", async () => {
    const result = await runCommand(TEST_COMMAND, handlerReturning([]));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(TEST_COMMAND);
  });

  it("returns Err with the rejection", async () => {
    const result = await runCommand(TEST_COMMAND, handlerReturning(REJECTION));
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(REJECTION);
  });

  it("returns Err with the failures", async () => {
    const result = await runCommand(TEST_COMMAND, handlerReturning([FAILURE]));
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual([FAILURE]);
  });
});
