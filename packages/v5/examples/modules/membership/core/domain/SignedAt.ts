import { z } from 'zod';

export const signedAt = z.iso.datetime({ offset: true }).brand<"SignedAt">();
export type SignedAt = z.infer<typeof signedAt>;