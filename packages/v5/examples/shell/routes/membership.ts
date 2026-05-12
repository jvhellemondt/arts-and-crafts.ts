import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import {
  schema,
  handle,
} from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { v7 as uuidv7 } from "uuid";
import z from "zod";

const openMembershipHandlerRoute = new Hono();
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
    const id = aggregateId.parse(uuidv7());
    handle(c, id).catch(console.error);
    return c.json({ accepted: true, id }, 202);
  },
);

export { openMembershipHandlerRoute };
