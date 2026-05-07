import z from "zod";

export const email = z.email().brand<"Email">();

export type Email = {
  parsed: z.infer<typeof email>;
  input: z.input<typeof email>;
};
