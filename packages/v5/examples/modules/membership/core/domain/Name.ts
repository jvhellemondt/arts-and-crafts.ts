import z from "zod";

export const name = z.string().brand<"Name">();

export type Name = z.infer<typeof name>;
