import z from "zod";
import { tosVersion } from "./TosVersion.ts";
import { signedAt } from "./SignedAt.ts";

export const tosAcceptance = z
  .object({
    version: tosVersion,
    signedAt: signedAt,
  })
  .brand<"TosAcceptance">();

export type TosAcceptance = z.infer<typeof tosAcceptance>;
