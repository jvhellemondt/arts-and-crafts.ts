import z from "zod";
import { tosVersion } from "./TosVersion.ts";
import { signedAt } from "./SignedAt.ts";

export const tosAcceptance = z
  .object({
    version: tosVersion,
    signedAt: signedAt,
  })
  .brand<"TosAcceptance">();

export type TosAcceptance = {
  parsed: z.infer<typeof tosAcceptance>;
  input: z.input<typeof tosAcceptance>;
};
