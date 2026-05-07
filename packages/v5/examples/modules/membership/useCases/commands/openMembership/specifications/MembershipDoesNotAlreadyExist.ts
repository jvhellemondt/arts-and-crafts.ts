import type { Specification } from "@core/shapes/Specification.ts";
import type { MembershipState } from "@examples/modules/membership/core/state.ts";

export class MembershipDoesNotAlreadyExist implements Specification<MembershipState> {
  isSatisfiedBy(state: MembershipState): boolean {
    return state.status === "initial";
  }
}
