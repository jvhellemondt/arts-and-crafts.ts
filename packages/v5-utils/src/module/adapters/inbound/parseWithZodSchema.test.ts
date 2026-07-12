import { z, ZodError } from "zod";
import { parseWithZodSchema } from "./parseWithZodSchema.ts";

const schema = z.object({ name: z.string() });

describe("parseWithZodSchema", () => {
  it("returns the parsed payload for valid input", () => {
    expect(parseWithZodSchema(schema)({ name: "John" })).toEqual({ name: "John" });
  });

  it("throws a ZodError for invalid input", () => {
    expect(() => parseWithZodSchema(schema)({ name: 42 })).toThrow(ZodError);
  });

  it("throws a ZodError for undefined input", () => {
    expect(() => parseWithZodSchema(schema)(undefined)).toThrow(ZodError);
  });
});
