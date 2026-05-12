import { z } from "zod";

export const aggregateId = z.uuid({ version: "v7" }).brand<"AggregateId">();
export type AggregateId = {
  parsed: z.infer<typeof aggregateId>;
  input: z.input<typeof aggregateId>;
};
