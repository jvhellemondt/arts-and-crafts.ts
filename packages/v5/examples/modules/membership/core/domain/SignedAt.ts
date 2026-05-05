import { z } from 'zod';

export const signedAt = z.iso.datetime().brand<"SignedAt">();
export type SignedAt = z.infer<typeof signedAt>;