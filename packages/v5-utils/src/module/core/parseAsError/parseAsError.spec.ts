import { parseAsError } from "./parseAsError.ts";

describe("parseAsError", () => {
  it("returns the same error if input is already an Error", () => {
    const err = new Error("fail");
    expect(parseAsError(err)).toBe(err);
  });

  it("converts a string to an Error", () => {
    const err = parseAsError("oops");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("oops");
  });

  it("stringifies an object", () => {
    const obj = { code: 123, message: "bad" };
    const err = parseAsError(obj);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe(JSON.stringify(obj));
  });

  it("handles circular objects gracefully", () => {
    const obj: any = {};
    // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-member-access
    obj.self = obj;
    const err = parseAsError(obj);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Unknown error");
  });

  it("converts a number to an Error", () => {
    const err = parseAsError(404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("404");
  });

  it('converts null to an Error with message "null"', () => {
    const err = parseAsError(null);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("null");
  });

  it('converts undefined to an Error with message "undefined"', () => {
    const err = parseAsError(undefined);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("undefined");
  });

  it('converts a symbol to an Error with message "undefined"', () => {
    const err = parseAsError(Symbol("test"));
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Symbol(test)");
  });
});
