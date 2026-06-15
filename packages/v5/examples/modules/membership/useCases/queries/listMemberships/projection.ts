import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";

export interface MembershipSummary {
  id: string;
  name: string;
  email: string;
  status: "open";
}

export type ListMembershipsProjection = Record<string, MembershipSummary>;

export const emptyProjection: ListMembershipsProjection = {};

export function apply(
  state: ListMembershipsProjection,
  event: MembershipEventV1,
): ListMembershipsProjection {
  switch (event.type) {
    case "MembershipOpened.v1":
      return {
        ...state,
        [event.payload.membershipId]: {
          id: event.payload.membershipId,
          name: event.payload.name,
          email: event.payload.email,
          status: "open",
        },
      };
    default:
      return state;
  }
}
