import { z } from "zod";

export const tosVersion = z.string().min(1).brand<"TosVersion">();
export type TosVersion = {
  parsed: z.infer<typeof tosVersion>;
  input: z.input<typeof tosVersion>;
};
