import type { OpenMembershipDecision } from "./decision.ts";
import { OPEN_MEMBERSHIP, type OpenMembershipCommand } from "./command.ts";
import { v7 as uuidv7 } from "uuid";
import { MembershipDoesNotAlreadyExist } from "./specifications/MembershipDoesNotAlreadyExist.ts";
import type { DecisionState } from "./decisionState.ts";
import { createStreamKey } from "../../../../../shared/utils/createStreamKey.ts";
import { ANCHOR_EMAIL, ANCHOR_MEMBERSHIP } from "../../../core/anchors.ts";

export function decideOpenMembership(
  state: DecisionState,
  command: OpenMembershipCommand,
): OpenMembershipDecision {
  const spec = new MembershipDoesNotAlreadyExist();
  if (!spec.isSatisfiedBy(state)) {
    return {
      accepted: false,
      rejection: {
        kind: "rejection",
        reason: "Membership already exists",
        code: "MEMBERSHIP_ALREADY_EXISTS",
      },
    };
  }
  const sharedProps = {
    commandId: command.id,
    commandType: OPEN_MEMBERSHIP,
    timestamp: new Date().getTime(),
    metadata: command.metadata,
  };

  return {
    accepted: true,
    events: [
      {
        type: "MembershipOpened.v1",
        id: uuidv7(),
        kind: "domain",
        concerns: [
          createStreamKey(ANCHOR_MEMBERSHIP, state.id),
          createStreamKey(ANCHOR_EMAIL, command.payload.email),
        ],
        payload: {
          membershipId: state.id,
          name: command.payload.name,
          email: command.payload.email,
        },
        ...sharedProps,
      },
    ],
    intents: [
      {
        kind: "intent",
        type: "NotifyUserToVerifyEmail.v1",
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
        id: uuidv7(),
        ...sharedProps,
      },
    ],
  };
}
