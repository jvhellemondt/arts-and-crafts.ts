import { parseJsonBody } from "./parseJsonBody.ts";

describe("parseJsonBody", () => {
  it("parses a valid JSON body", () => {
    const event = { body: JSON.stringify({ name: "John" }) };
    const result = parseJsonBody(event);
    result.match(
      (data) => {
        expect(data.body).toEqual({
          name: "John",
        });
      },
      () => {
        throw new Error("parseJsonBody > did not expect an err result");
      },
    );
  });

  it("returns err for a malformed JSON body", () => {
    const event = { body: "{not json" };
    const result = parseJsonBody(event);
    result.match(
      () => {
        throw new Error("parseJsonBody > did not expect an ok result");
      },
      (err) => {
        expect(err.name).toBe("JSONParseError");
      },
    );
  });

  it("returns err when the body is absent", () => {
    const event = { body: undefined };
    const result = parseJsonBody(event);
    result.match(
      () => {
        throw new Error("parseJsonBody > did not expect an ok result");
      },
      (err) => {
        expect(err.name).toBe("NoBodyError");
      },
    );
  });
});
