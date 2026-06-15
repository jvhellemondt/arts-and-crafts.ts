import type { OpenMembershipDecision } from "./decision.ts";
import { OPEN_MEMBERSHIP, type OpenMembershipCommand } from "./command.ts";
import { v7 as uuidv7 } from "uuid";
import { MembershipDoesNotAlreadyExist } from "./specifications/MembershipDoesNotAlreadyExist.ts";
import type { DecisionState } from "./decisionState.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { MEMBERSHIP_AGGREGATE_NAME } from "@examples/modules/membership/core/AggregateTypes.ts";

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
        payload: {
          name: command.payload.name,
          email: command.payload.email,
        },
        kind: "domain",
        concerns: [createStreamKey(MEMBERSHIP_AGGREGATE_NAME, state.id)],
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
