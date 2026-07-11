import { describe, expect, it } from "vitest";
import { address } from "./Address.ts";

const VALID_ADDRESS = {
  street: "123 Main St",
  city: "Amsterdam",
  postalCode: "1011AB",
  countryCode: "NL",
};

describe("Address", () => {
  it("parses a valid address with required fields only", () => {
    const result = address.safeParse(VALID_ADDRESS);
    expect(result.success).toBe(true);
  });

  it("parses a valid address with all optional fields", () => {
    const result = address.safeParse({
      ...VALID_ADDRESS,
      streetLine2: "Apt 4B",
      state: "Noord-Holland",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when street is missing", () => {
    const { street: _, ...withoutStreet } = VALID_ADDRESS;
    const result = address.safeParse(withoutStreet);
    expect(result.success).toBe(false);
  });

  it("rejects when street is empty", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, street: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when street exceeds 100 characters", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, street: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects when streetLine2 exceeds 100 characters", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, streetLine2: "B".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects when city is missing", () => {
    const { city: _, ...withoutCity } = VALID_ADDRESS;
    const result = address.safeParse(withoutCity);
    expect(result.success).toBe(false);
  });

  it("rejects when city is empty", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, city: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when city exceeds 100 characters", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, city: "C".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects when state exceeds 100 characters", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, state: "S".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects when postalCode is missing", () => {
    const { postalCode: _, ...withoutPostalCode } = VALID_ADDRESS;
    const result = address.safeParse(withoutPostalCode);
    expect(result.success).toBe(false);
  });

  it("rejects when postalCode is empty", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, postalCode: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when postalCode exceeds 20 characters", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, postalCode: "1".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects when countryCode is missing", () => {
    const { countryCode: _, ...withoutCountry } = VALID_ADDRESS;
    const result = address.safeParse(withoutCountry);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid country code", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, countryCode: "XX" });
    expect(result.success).toBe(false);
  });

  it("parses with a US country code", () => {
    const result = address.safeParse({ ...VALID_ADDRESS, countryCode: "US" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-object value", () => {
    const result = address.safeParse("123 Main St");
    expect(result.success).toBe(false);
  });
});
