import { ZodError, z } from "zod";
import { parsePayload } from "./parsePayload.ts";

describe("parsePayload", () => {
  const schema = z.object({ name: z.string() });

  it("returns Ok with the parsed payload for valid input", () => {
    const result = parsePayload(schema, { name: "John" });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ name: "John" });
  });

  it("returns Err with the schema's ZodError for invalid input", () => {
    const result = parsePayload(schema, {});
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ZodError);
  });
});
