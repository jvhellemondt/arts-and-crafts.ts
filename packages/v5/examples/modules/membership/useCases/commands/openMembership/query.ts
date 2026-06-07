import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { OpenMembershipCommand } from "./command.ts";

/**
 * The dynamic consistency boundary for opening a membership: every
 * `MembershipOpened.v1` event carrying the command's membership tag. Reading
 * this boundary tells the decider whether the membership already exists, and
 * the read position guards the append against a concurrent open.
 */
export function buildOpenMembershipQuery(command: OpenMembershipCommand): DcbQuery {
  return {
    criteria: [{ types: ["MembershipOpened.v1"], tags: command.tags }],
  };
}
