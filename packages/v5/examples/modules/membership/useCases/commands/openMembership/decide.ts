import type { MembershipState } from "@examples/modules/membership/core/state.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import type { OpenMembershipCommand } from "./command.ts";
import { v7 as uuidv7 } from "uuid";
import { MembershipDoesNotAlreadyExist } from "./specifications/MembershipDoesNotAlreadyExist.ts";

export function decideOpenMembership(
  state: MembershipState,
  command: OpenMembershipCommand,
): OpenMembershipDecision {
  const spec = new MembershipDoesNotAlreadyExist();
  if (!spec.isSatisfiedBy(state)) {
    return {
      accepted: false,
      rejection: {
        reason: "Membership already exists",
        code: "MEMBERSHIP_ALREADY_EXISTS",
      },
    };
  }
  return {
    accepted: true,
    events: [
      {
        type: "MembershipOpened.v1",
        id: uuidv7(),
        payload: {
          aggregateId: state.id,
          name: command.payload.name,
          email: command.payload.email,
        },
        kind: "domain",
        aggregateType: "Membership",
        aggregateId: state.id,
        timestamp: new Date().getTime(),
        metadata: command.metadata,
      },
    ],
    intents: [
      {
        kind: "intent",
        type: "NotifyUserToVerifyEmail.v1",
        payload: {
          aggregateId: state.id,
          name: command.payload.name,
          email: command.payload.email,
        },
        timestamp: new Date().getTime(),
        metadata: command.metadata,
        id: uuidv7(),
      },
    ],
  };
}
