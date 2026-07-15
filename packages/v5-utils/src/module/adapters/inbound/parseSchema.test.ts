import { z } from "zod";
import { parseSchema } from "./parseSchema.ts";

describe("parseSchema", () => {
  const schema = z.object({ name: z.string() });

  it("returns Ok with the parsed payload for valid input", async () => {
    const result = await parseSchema(schema)({ body: { name: "John" } });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ name: "John" });
  });

  it("returns Err with the schema's ZodError for invalid input", async () => {
    const result = await parseSchema(schema)({ body: {} });
    result.match(
      () => {
        throw new Error("parseSchema > should return an Err");
      },
      (err) => {
        expect(err.code).toBe("PARSE_FAILED");
        expect(err.validationErrors?.at(0)?.field).toBe("name");
      },
    );
  });
});
