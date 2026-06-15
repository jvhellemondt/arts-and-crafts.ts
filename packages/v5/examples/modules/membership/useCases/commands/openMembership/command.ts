import type { Metadata } from "@core/shapes/Metadata.ts";
import type { Command } from "@useCases/command/shapes/Command.ts";
import { z } from "zod";
import { name } from "../../../core/domain/Name.ts";
import { email } from "../../../core/domain/Email.ts";
import { type AggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { v7 as uuidv7 } from "uuid";
import { MEMBERSHIP_AGGREGATE_NAME } from "@examples/modules/membership/core/AggregateTypes.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";

export const OPEN_MEMBERSHIP = "OpenMembership";

export const openMembershipCommandPayload = z.object({
  name,
  email,
});

export type OpenMembershipCommandPayload = z.output<typeof openMembershipCommandPayload>;

export function createOpenMembershipCommand(
  aggregateId: AggregateId["parsed"],
  payload: OpenMembershipCommandPayload,
  metadata: Metadata,
): Command<typeof OPEN_MEMBERSHIP, OpenMembershipCommandPayload> {
  return {
    type: OPEN_MEMBERSHIP,
    kind: "command",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    criteria: [createStreamKey(MEMBERSHIP_AGGREGATE_NAME, aggregateId)],
    payload,
    metadata,
  };
}

export type OpenMembershipCommand = ReturnType<typeof createOpenMembershipCommand>;
