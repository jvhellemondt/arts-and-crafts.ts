import type { Metadata } from "@core/shapes/Metadata.ts";
import type { Command } from "@useCases/command/shapes/Command.ts";
import { z } from "zod";
import { name } from "../../../core/domain/Name.ts";
import { email } from "../../../core/domain/Email.ts";
import { v7 as uuidv7 } from "uuid";

export const OpenMembershipCommandPayload = z.object({
  name: name,
  email: email,
});

export type OpenMembershipCommandPayload = z.output<typeof OpenMembershipCommandPayload>;

export function createOpenMembershipCommand(
  payload: OpenMembershipCommandPayload,
  metadata: Metadata,
): Command {
  return {
    type: "OpenMembership",
    kind: "command",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    payload,
    metadata,
  };
}
