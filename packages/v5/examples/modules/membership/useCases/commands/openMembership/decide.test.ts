import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import type { OpenMembershipState } from "./state.ts";
import { randomUUID } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import { decideOpenMembership } from "./decide.ts";
import { aggregateId as aggregateIdSchema } from "@examples/modules/membership/core/domain/AggregateId.ts";

const aggregateId = aggregateIdSchema.parse(uuidv7());

const makeMetadata = () => ({
  correlationId: randomUUID(),
  causationId: randomUUID(),
});

const makeCommand = () =>
  createOpenMembershipCommand(
    aggregateId,
    openMembershipCommandPayload.parse({
      name: "Jane Doe",
      email: "jane@example.com",
    }),
    makeMetadata(),
  );

describe("decideOpenMembership", () => {
  describe("given the membership does not exist", () => {
    const state: OpenMembershipState = { exists: false };

    it("should accept the decision", () => {
      const decision = decideOpenMembership(state, makeCommand());
      expect(decision.accepted).toBe(true);
    });

    it("should emit a MembershipOpened event tagged with the subject and command", () => {
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
      if (!decision.accepted) return;

      expect(decision.events).toHaveLength(1);
      expect(decision.events[0]).toMatchObject({
        type: "MembershipOpened.v1",
        kind: "domain",
        tags: [
          { key: "membership", value: aggregateId },
          { key: "command", value: command.id },
        ],
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });

    it("should stage a NotifyUserToVerifyEmailV1 intent tagged with the subject", () => {
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
      if (!decision.accepted) return;

      expect(decision.intents).toHaveLength(1);
      expect(decision.intents[0]).toMatchObject({
        type: "NotifyUserToVerifyEmail.v1",
        kind: "intent",
        tags: [{ key: "membership", value: aggregateId }],
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });
  });

  describe("given the membership already exists", () => {
    it("should reject with MEMBERSHIP_ALREADY_EXISTS", () => {
      const state: OpenMembershipState = { exists: true };
      const decision = decideOpenMembership(state, makeCommand());

      expect(decision.accepted).toBe(false);
      if (decision.accepted) return;

      expect(decision.rejection).toMatchObject({
        code: "MEMBERSHIP_ALREADY_EXISTS",
        reason: expect.any(String),
      });
    });
  });
});
