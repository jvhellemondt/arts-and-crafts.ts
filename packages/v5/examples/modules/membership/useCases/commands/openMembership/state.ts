import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";

/**
 * The decision state for opening a membership. The decision only needs to know
 * whether the membership already exists within the boundary, so this is all the
 * slice projects — it does not reconstruct the full membership lifecycle.
 */
export interface OpenMembershipState {
  readonly exists: boolean;
}

export const initialOpenMembershipState: OpenMembershipState = { exists: false };

export function evolveOpenMembership(
  state: OpenMembershipState,
  event: MembershipEventV1,
): OpenMembershipState {
  switch (event.type) {
    case "MembershipOpened.v1":
      return { exists: true };
    default:
      return state;
  }
}
