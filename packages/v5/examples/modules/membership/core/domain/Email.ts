import z from "zod";

export const email = z.email().brand<"Email">();

export type Email = z.infer<typeof email>;
