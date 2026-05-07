import { countries } from "countries-list";
import { z } from "zod";

const COUNTRY_CODES = Object.keys(countries);

export const address = z.object({
  street: z.string().min(1).max(100),
  streetLine2: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  countryCode: z.enum(COUNTRY_CODES),
}).brand<"Address">();

export type Address = {
  parsed: z.infer<typeof address>;
  input: z.input<typeof address>;
};
