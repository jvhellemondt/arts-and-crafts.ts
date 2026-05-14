import { name } from "@examples/modules/membership/core/domain/Name.ts";
import { email } from "@examples/modules/membership/core/domain/Email.ts";
import z from "zod";

export const OpenMembershipSchema = z.object({
  name,
  email,
});
