import { invariant } from "./invariant.ts";

describe("invariant", () => {
  const onInvalidFn = () => {
    throw new Error("PANIC");
  };

  it("does nothing if condition is true", () => {
    expect(() => invariant(true, onInvalidFn)).not.toThrow();
  });

  it("calls onInvalidFn if condition is false", () => {
    expect(() => invariant(false, onInvalidFn)).toThrow();
  });
});
