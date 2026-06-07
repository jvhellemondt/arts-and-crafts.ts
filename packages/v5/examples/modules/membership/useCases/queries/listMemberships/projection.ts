import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { MEMBERSHIP_TAG_KEY } from "@examples/modules/membership/core/tags.ts";
import { subjectOf } from "@examples/shared/utils/subjectOf.ts";

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
    case "MembershipOpened.v1": {
      const id = subjectOf(event.tags, MEMBERSHIP_TAG_KEY);
      if (id === undefined) return state;
      return {
        ...state,
        [id]: {
          id,
          name: event.payload.name,
          email: event.payload.email,
          status: "open",
        },
      };
    }
    default:
      return state;
  }
}
