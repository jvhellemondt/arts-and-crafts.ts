import { openMembershipSchema } from "./schema.ts";

const VALID_INPUT = { name: "John Doe", email: "john@example.com" };

describe("openMembershipSchema", () => {
  it("accepts a valid name and email", () => {
    expect(() => openMembershipSchema.parse(VALID_INPUT)).not.toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => openMembershipSchema.parse({ email: "john@example.com" })).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() => openMembershipSchema.parse({ ...VALID_INPUT, email: "not-an-email" })).toThrow();
  });

  it("rejects a missing email", () => {
    expect(() => openMembershipSchema.parse({ name: "John Doe" })).toThrow();
  });

  it("does not include membershipId in the parsed output", () => {
    const result = openMembershipSchema.parse(VALID_INPUT);
    expect(result).not.toHaveProperty("membershipId");
  });

  it("strips membershipId if provided in the input", () => {
    const result = openMembershipSchema.parse({ ...VALID_INPUT, membershipId: "some-id" });
    expect(result).not.toHaveProperty("membershipId");
  });
});
