import { OpenMembershipSchema } from "./schema.ts";

describe("OpenMembershipSchema", () => {
  it("should validate a valid schema", () => {
    const validSchema = {
      name: "Jens",
      email: "jens@example.com",
    };
    const result = OpenMembershipSchema.safeParse(validSchema);
    expect(result.success).toBe(true);
  });

  it("should validate an invalid schema", () => {
    const invalidSchema = {
      name: undefined,
      email: undefined,
    };
    const result = OpenMembershipSchema.safeParse(invalidSchema);
    expect(result.success).toBe(false);
  });
});
