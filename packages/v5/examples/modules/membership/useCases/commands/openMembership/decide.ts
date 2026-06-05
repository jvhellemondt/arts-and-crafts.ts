import {
  MEMBERSHIP_AGGREGATE,
  type MembershipState,
} from "@examples/modules/membership/core/state.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import { OPEN_MEMBERSHIP, type OpenMembershipCommand } from "./command.ts";
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
        kind: "rejection",
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
          name: command.payload.name,
          email: command.payload.email,
        },
        kind: "domain",
        aggregateId: state.id,
        aggregateType: MEMBERSHIP_AGGREGATE,
        commandId: command.id,
        commandType: OPEN_MEMBERSHIP,
        timestamp: new Date().getTime(),
        metadata: command.metadata,
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
        timestamp: new Date().getTime(),
        metadata: command.metadata,
        id: uuidv7(),
        aggregateId: state.id,
        aggregateType: MEMBERSHIP_AGGREGATE,
        commandId: command.id,
        commandType: OPEN_MEMBERSHIP,
      },
    ],
  };
}
