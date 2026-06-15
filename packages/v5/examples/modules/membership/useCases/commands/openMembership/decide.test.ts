import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import { randomUUID } from "node:crypto";
import { v7 as uuidv7 } from "uuid";
import { decideOpenMembership } from "./decide.ts";
import type { DecisionState } from "./decisionState.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { ANCHOR_EMAIL, ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";

const membershipId = uuidv7();

const makeMetadata = () => ({
  correlationId: randomUUID(),
  causationId: randomUUID(),
});

const makeInitialState = (): DecisionState => ({
  status: "initial",
  id: membershipId,
});

const makeCommand = () =>
  createOpenMembershipCommand(
    openMembershipCommandPayload.parse({
      membershipId,
      name: "Jane Doe",
      email: "jane@example.com",
    }),
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
        type: "MembershipOpened.v1",
        kind: "domain",
        concerns: [
          createStreamKey(ANCHOR_MEMBERSHIP, membershipId),
          createStreamKey(ANCHOR_EMAIL, command.payload.email),
        ],
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });

    it("should stage a NotifyUserToVerifyEmailV1 intent", () => {
      const state = makeInitialState();
      const command = makeCommand();
      const decision = decideOpenMembership(state, command);

      expect(decision.accepted).toBe(true);
      if (!decision.accepted) return;

      expect(decision.intents).toHaveLength(1);
      expect(decision.intents[0]).toMatchObject({
        type: "NotifyUserToVerifyEmail.v1",
        kind: "intent",
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
      });
    });
  });

  describe.each<{ status: DecisionState["status"] }>([{ status: "open" }])(
    "given the membership is in $status state",
    ({ status }) => {
      it("should reject with MEMBERSHIP_ALREADY_EXISTS", () => {
        const state = { status, id: membershipId } as DecisionState;
        const command = makeCommand();
        const decision = decideOpenMembership(state, command);

        expect(decision.accepted).toBe(false);
        if (decision.accepted) return;

        expect(decision.rejection).toMatchObject({
          code: "MEMBERSHIP_ALREADY_EXISTS",
          reason: expect.any(String),
        });
      });
    },
  );
});
