import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { findConcern } from "@examples/shared/utils/findConcern.ts";

export interface MembershipSummary {
  id: string;
  name: string;
  email: string;
  status: "open";
}

export type ListMembershipsProjection = Record<StreamKey, MembershipSummary>;

export const emptyProjection: ListMembershipsProjection = {};

export function apply(
  state: ListMembershipsProjection,
  event: MembershipEventV1,
): ListMembershipsProjection {
  switch (event.type) {
    case "MembershipOpened.v1":
      const concern = findConcern(event.concerns, ANCHOR_MEMBERSHIP);
      if (!concern) throw new Error(`${ANCHOR_MEMBERSHIP} concern not found!`);
      return {
        ...state,
        [concern]: {
          id: concern,
          name: event.payload.name,
          email: event.payload.email,
          status: "open",
        },
      };
    default:
      return state;
  }
}
