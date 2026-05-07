import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import type { MembershipState } from "@examples/modules/membership/core/state.ts";
import { randomUUID } from "node:crypto";
import { membershipId } from "@examples/modules/membership/core/domain/MembershipId.ts";
import { v7 as uuidv7 } from "uuid";
import { decideOpenMembership } from "./decide.ts";

const makeMetadata = () => ({
  correlationId: randomUUID(),
  causationId: randomUUID(),
});

const makeInitialState = (): MembershipState => ({
  status: "initial",
  id: membershipId.parse(uuidv7()),
});

const makeCommand = () =>
  createOpenMembershipCommand(
    openMembershipCommandPayload.parse({ name: "Jane Doe", email: "jane@example.com" }),
    makeMetadata(),
  );

describe("decideOpenMembership", () => {
  describe("given the membership is in initial state", () => {
    it("should accept the decision", () => {
      const state = makeInitialState();
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
    });

    it("should emit a MembershipOpened event", () => {
      const state = makeInitialState();
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
      if (!decision.accepted) return;

      expect(decision.events).toHaveLength(1);
      expect(decision.events[0]).toMatchObject({
        type: "MembershipOpened",
        kind: "domain",
        aggregateType: "Membership",
        aggregateId: state.id,
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });

    it("should stage a NotifyUserToVerifyEmail intent", () => {
      const state = makeInitialState();
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
      if (!decision.accepted) return;

      expect(decision.intents).toHaveLength(1);
      expect(decision.intents[0]).toMatchObject({
        type: "NotifyUserToVerifyEmail",
        kind: "intent",
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });
  });

  describe.each<{ status: MembershipState["status"] }>([
    { status: "open" },
    { status: "active" },
    { status: "closed" },
  ])("given the membership is in $status state", ({ status }) => {
    it("should reject with MEMBERSHIP_ALREADY_EXISTS", () => {
      const state = { status, id: randomUUID() } as MembershipState;
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(false);
      if (decision.accepted) return;

      expect(decision.rejection).toMatchObject({
        code: "MEMBERSHIP_ALREADY_EXISTS",
        reason: expect.any(String),
      });
    });
  });
});
