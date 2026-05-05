import { z } from "zod";

export const verificationToken = z.uuid({ version: "v7" });
export type VerificationToken = z.infer<typeof verificationToken>;
