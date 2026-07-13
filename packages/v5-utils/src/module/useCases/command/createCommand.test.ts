import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { createCommand } from "./createCommand.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const METADATA: Metadata = { correlationId: "c1", causationId: "ca1" };

describe("createCommand", () => {
  it("returns a command with the given type", () => {
    const command = createCommand("TestCommand", { value: "test" }, METADATA);
    expect(command.type).toBe("TestCommand");
  });

  it("returns a command with kind command", () => {
    const command = createCommand("TestCommand", { value: "test" }, METADATA);
    expect(command.kind).toBe("command");
  });

  it("returns a command with the provided payload", () => {
    const payload = { value: "test" };
    const command = createCommand("TestCommand", payload, METADATA);
    expect(command.payload).toBe(payload);
  });

  it("returns a command with the provided metadata", () => {
    const command = createCommand("TestCommand", { value: "test" }, METADATA);
    expect(command.metadata).toBe(METADATA);
  });

  it("returns a command with a UUIDv7 id", () => {
    const command = createCommand("TestCommand", { value: "test" }, METADATA);
    expect(command.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns a command with a unique id on each call", () => {
    const first = createCommand("TestCommand", { value: "test" }, METADATA);
    const second = createCommand("TestCommand", { value: "test" }, METADATA);
    expect(first.id).not.toBe(second.id);
  });

  it("returns a command with a timestamp close to the current time", () => {
    const before = Date.now();
    const command = createCommand("TestCommand", { value: "test" }, METADATA);
    const after = Date.now();
    expect(command.timestamp).toBeGreaterThanOrEqual(before);
    expect(command.timestamp).toBeLessThanOrEqual(after);
  });
});
