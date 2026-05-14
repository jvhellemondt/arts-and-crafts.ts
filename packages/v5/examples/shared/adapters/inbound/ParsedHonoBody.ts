import type z from "zod";

export type ParsedHonoBody<T = typeof z> = {
  in: { json: z.input<T> };
  out: { json: z.output<T> };
};
