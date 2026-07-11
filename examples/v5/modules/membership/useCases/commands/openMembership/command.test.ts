import { describe, expect, it } from "vitest";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import { v7 as uuidv7 } from "uuid";

const VALID_PAYLOAD = openMembershipCommandPayload.parse({
  membershipId: uuidv7(),
  name: "Alice",
  email: "alice@example.com",
});

const VALID_METADATA: Metadata = {
  correlationId: "corr-123",
  causationId: "cause-456",
};

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("openMembershipCommandPayload", () => {
  it("parses a valid payload with name and email", () => {
    const result = openMembershipCommandPayload.safeParse({
      membershipId: uuidv7(),
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when membershipId is missing", () => {
    const result = openMembershipCommandPayload.safeParse({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name is missing", () => {
    const result = openMembershipCommandPayload.safeParse({
      membershipId: uuidv7(),
      email: "alice@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when email is missing", () => {
    const result = openMembershipCommandPayload.safeParse({
      membershipId: uuidv7(),
      name: "Alice",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = openMembershipCommandPayload.safeParse({
      name: "Alice",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("createOpenMembershipCommand", () => {
  it("returns a command with type OpenMembership", () => {
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(command.type).toBe("OpenMembership");
  });

  it("returns a command with kind command", () => {
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(command.kind).toBe("command");
  });

  it("returns a command with the provided payload", () => {
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(command.payload).toBe(VALID_PAYLOAD);
  });

  it("returns a command with the provided metadata", () => {
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(command.metadata).toBe(VALID_METADATA);
  });

  it("returns a command with a UUIDv7 id", () => {
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(command.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns a command with a unique id on each call", () => {
    const first = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    const second = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    expect(first.id).not.toBe(second.id);
  });

  it("returns a command with a timestamp close to the current time", () => {
    const before = Date.now();
    const command = createOpenMembershipCommand(VALID_PAYLOAD, VALID_METADATA);
    const after = Date.now();
    expect(command.timestamp).toBeGreaterThanOrEqual(before);
    expect(command.timestamp).toBeLessThanOrEqual(after);
  });
});
