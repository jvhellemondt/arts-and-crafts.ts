import type z from "zod";

export type ParsedHonoBody<TKind extends "json" | "query" = "json", T = typeof z> = {
  in: { [K in TKind]: z.input<T> };
  out: { [K in TKind]: z.output<T> };
};
