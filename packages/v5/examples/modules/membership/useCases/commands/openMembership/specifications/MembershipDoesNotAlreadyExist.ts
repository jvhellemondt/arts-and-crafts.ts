import type { EvaluateCandidate } from "@core/capabilities/EvaluateCandidate.ts";
import type { OpenMembershipState } from "../state.ts";

export class MembershipDoesNotAlreadyExist implements EvaluateCandidate<OpenMembershipState> {
  isSatisfiedBy(candidate: OpenMembershipState): boolean {
    return !candidate.exists;
  }
}
