import { fail } from "./fail.ts";

describe("fail (with Error parameter)", () => {
  it("should throw the provided Error object", () => {
    const errorMessage = "This is an expected error message!";
    const errorInstance = new Error(errorMessage);

    expect(fail(errorInstance)).toThrow(errorInstance);
    expect(fail(errorInstance)).toThrow(Error);
  });
});
