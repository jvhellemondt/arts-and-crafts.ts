import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import { isRejection } from "./isRejection.ts";

const REJECTION: Rejection = { kind: "rejection", code: "X", reason: "y" };

describe("isRejection", () => {
  it("returns true for a Rejection", () => {
    expect(isRejection(REJECTION)).toBe(true);
  });

  it("returns false for a failure (different kind value)", () => {
    expect(isRejection({ kind: "failure", code: "X", reason: "y" })).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isRejection([])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRejection(null)).toBe(false);
  });

  it("returns false for a non-object value", () => {
    expect(isRejection(42)).toBe(false);
  });

  it("returns false for an object without a kind property", () => {
    expect(isRejection({})).toBe(false);
  });
});
