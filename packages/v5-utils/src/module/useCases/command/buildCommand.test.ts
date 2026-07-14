import { ZodError, z } from "zod";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { buildCommand } from "./buildCommand.ts";

interface TestPayload {
  name: string;
}

type TestCommand = Command<"TestCommand", TestPayload>;

function toTestCommand(payload: TestPayload, metadata: Metadata): TestCommand {
  return {
    id: "cmd-1",
    type: "TestCommand",
    kind: "command",
    payload,
    metadata,
    timestamp: 0,
  };
}

const schema = z.object({ name: z.string() });

describe("buildCommand", () => {
  it("returns Ok with the command built from payload and header metadata", () => {
    const result = buildCommand({
      schema,
      raw: { name: "John" },
      headers: { "x-correlation-id": "corr-1", "x-request-id": "cause-1" },
      toCommand: toTestCommand,
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: "cmd-1",
      type: "TestCommand",
      kind: "command",
      payload: { name: "John" },
      metadata: { correlationId: "corr-1", causationId: "cause-1" },
      timestamp: 0,
    });
  });

  it("returns Err with the ZodError for an invalid payload", () => {
    const result = buildCommand({
      schema,
      raw: {},
      headers: {},
      toCommand: toTestCommand,
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ZodError);
  });
});
