import { openMembershipCommandPayload } from "../../command.ts";

export const openMembershipSchema = openMembershipCommandPayload.omit({ membershipId: true });
