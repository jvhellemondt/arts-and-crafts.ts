import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { DecisionState } from "./decisionState.ts";

export const evolveOpenMembership = (
  aggregateId: string,
  events: MembershipEventV1[],
): DecisionState => {
  const initialState: DecisionState = { status: "initial", id: aggregateId };
  return events.reduce((state: DecisionState, event) => {
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
