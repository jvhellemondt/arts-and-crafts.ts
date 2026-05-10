import { name } from "@examples/modules/membership/core/domain/Name.ts";
import { email } from "@examples/modules/membership/core/domain/Email.ts";
import type { OpenMembershipCommandPayload } from "../../command.ts";
import { sleep } from "bun";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { v7 as uuidv7 } from "uuid";
import { membershipId } from "@examples/modules/membership/core/domain/MembershipId.ts";
import z from "zod";

const openMembershipHandlerRoute = new Hono();

export const schema = z.object({
  name,
  email,
});

openMembershipHandlerRoute.post(
  "membership/open",
  validator("json", (body, c) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return c.json({ message: "Invalid body", errors: fieldErrors }, 401);
    }
    return { body: parsed.data };
  }),
  async (c) => {
    const { body } = c.req.valid("json");
    const id = membershipId.parse(uuidv7());
    handle({ ...body, membershipId: id }).catch(console.error);
    return c.json({ accepted: true, id }, 202);
  },
);

export { openMembershipHandlerRoute };

async function handle(body: OpenMembershipCommandPayload) {
  await sleep(1);
  console.log({ body });
  return "ok";
}
