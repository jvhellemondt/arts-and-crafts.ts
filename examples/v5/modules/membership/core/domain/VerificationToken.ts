import { z } from "zod";

export const verificationToken = z.uuid({ version: "v7" });
export type VerificationToken = {
  parsed: z.infer<typeof verificationToken>;
  input: z.input<typeof verificationToken>;
};
