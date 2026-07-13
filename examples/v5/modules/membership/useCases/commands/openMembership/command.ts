import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import { createCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { z } from "zod";
import { name } from "../../../core/domain/Name.ts";
import { email } from "../../../core/domain/Email.ts";
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
  return createCommand(OPEN_MEMBERSHIP, payload, metadata);
}

export type OpenMembershipCommand = ReturnType<typeof createOpenMembershipCommand>;
