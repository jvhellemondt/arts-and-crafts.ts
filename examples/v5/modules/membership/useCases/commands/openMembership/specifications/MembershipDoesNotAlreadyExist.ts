import type { EvaluateCandidate } from "@arts-and-crafts/v5/core/capabilities";
import type { DecisionState } from "../decisionState.ts";

export class MembershipDoesNotAlreadyExist implements EvaluateCandidate<DecisionState> {
  isSatisfiedBy(candidate: DecisionState): boolean {
    return candidate.status === "initial";
  }
}
