import { createStreamKey } from "./createStreamKey.ts";

describe("createStreamKey", () => {
  it("combines type and id with a # separator", () => {
    expect(createStreamKey("Membership", "membership-123")).toBe("Membership#membership-123");
  });

  it("works with different types and ids", () => {
    expect(createStreamKey("User", "user-99")).toBe("User#user-99");
    expect(createStreamKey("Seat", "A3")).toBe("Seat#A3");
  });
});
