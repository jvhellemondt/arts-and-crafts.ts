import z from "zod";

export const name = z.string().brand<"Name">();

export type Name = {
  parsed: z.infer<typeof name>;
  input: z.input<typeof name>;
};
