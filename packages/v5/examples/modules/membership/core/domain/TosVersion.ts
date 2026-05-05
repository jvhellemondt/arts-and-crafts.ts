import { z } from 'zod';

export const tosVersion = z.string().min(1).brand<"TosVersion">();
export type TosVersion = z.infer<typeof tosVersion>;