import type { Metadata } from "@core/shapes/Metadata.ts";
import type { Command } from "@useCases/command/shapes/Command.ts";
import { z } from "zod";
import { name } from "../../../core/domain/Name.ts";
import { email } from "../../../core/domain/Email.ts";
import { v7 as uuidv7 } from "uuid";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";

export const OPEN_MEMBERSHIP = "OpenMembership";

export const openMembershipCommandPayload = z.object({
  membershipId: aggregateId,
  name,
  email,
});

export type OpenMembershipCommandPayload = z.output<typeof openMembershipCommandPayload>;

export function createOpenMembershipCommand(
  payload: OpenMembershipCommandPayload,
  metadata: Metadata,
): Command<typeof OPEN_MEMBERSHIP, OpenMembershipCommandPayload> {
  return {
    type: OPEN_MEMBERSHIP,
    kind: "command",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    payload,
    metadata,
  };
}

export type OpenMembershipCommand = ReturnType<typeof createOpenMembershipCommand>;
