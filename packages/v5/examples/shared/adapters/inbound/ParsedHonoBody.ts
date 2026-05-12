import type z from "zod";

export type ParsedHonoBody<T = typeof z> =     {
  in: { json: { body: z.input<T> } };
  out: { json: { body: z.output<T> } };
};