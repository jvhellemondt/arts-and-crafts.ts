import type { MembershipEventV1 } from "./events/index.ts";
import type { MembershipState } from "./state.ts";

export const evolveMembership = (
  aggregateId: string,
  events: MembershipEventV1[],
): MembershipState => {
  const initialState: MembershipState = { status: "initial", id: aggregateId };
  return events.reduce((state: MembershipState, event) => {
    switch (event.type) {
      case "MembershipOpened.v1":
        return {
          status: "open",
          id: state.id,
          name: event.payload.name,
          email: event.payload.email,
        };
      default:
        return state;
    }
  }, initialState);
};
