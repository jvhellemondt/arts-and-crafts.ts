import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
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

export function toOpenMembershipCommand(
  payload: Omit<OpenMembershipCommandPayload, "membershipId">,
  metadata: Metadata,
): OpenMembershipCommand {
  return createOpenMembershipCommand(
    { ...payload, membershipId: aggregateId.parse(uuidv7()) },
    metadata,
  );
}
