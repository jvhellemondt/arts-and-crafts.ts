import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";

export interface MembershipSummary {
  id: string;
  name: string;
  email: string;
  status: "open";
}

export interface ListMembershipsProjection {
  byId: Record<string, MembershipSummary>;
}

export const emptyProjection: ListMembershipsProjection = { byId: {} };

export function apply(
  state: ListMembershipsProjection,
  event: MembershipEventV1,
): ListMembershipsProjection {
  switch (event.type) {
    case "MembershipOpened.v1":
      return {
        byId: {
          ...state.byId,
          [event.payload.aggregateId]: {
            id: event.payload.aggregateId,
            name: event.payload.name,
            email: event.payload.email,
            status: "open",
          },
        },
      };
    default:
      return state;
  }
}
