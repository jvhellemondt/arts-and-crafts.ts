import type { EvaluateCandidate } from "@core/capabilities/EvaluateCandidate.ts";
import type { MembershipState } from "@examples/modules/membership/core/state.ts";

export class MembershipDoesNotAlreadyExist implements EvaluateCandidate<MembershipState> {
  isSatisfiedBy(candidate: MembershipState): boolean {
    return candidate.status === "initial";
  }
}
