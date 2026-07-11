import type { EvaluateCandidate } from "@core/capabilities/EvaluateCandidate.ts";
import type { DecisionState } from "../decisionState.ts";

export class MembershipDoesNotAlreadyExist implements EvaluateCandidate<DecisionState> {
  isSatisfiedBy(candidate: DecisionState): boolean {
    return candidate.status === "initial";
  }
}
