import type { z } from "zod";
import { openMembershipCommandPayload } from "../../command.ts";

export const openMembershipSchema = openMembershipCommandPayload.omit({ membershipId: true });

export type OpenMembershipSchemaPayload = z.output<typeof openMembershipSchema>;
