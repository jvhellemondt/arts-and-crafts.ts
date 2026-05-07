import { z } from 'zod';

export const signedAt = z.iso.datetime({ offset: true }).brand<"SignedAt">();
export type SignedAt = {
  parsed: z.infer<typeof signedAt>;
  input: z.input<typeof signedAt>;
};