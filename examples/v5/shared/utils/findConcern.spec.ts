import { findConcern } from "./findConcern.ts";

const concerns = ["Membership#membership-123", "User#user-99"] as const;

describe("findConcern", () => {
  it("returns the stream key matching the given type", () => {
    expect(findConcern(concerns, "Membership")).toBe("Membership#membership-123");
    expect(findConcern(concerns, "User")).toBe("User#user-99");
  });

  it("returns undefined when no concern matches the type", () => {
    expect(findConcern(concerns, "Seat")).toBeUndefined();
  });

  it("returns undefined for an empty concerns array", () => {
    expect(findConcern([], "Membership")).toBeUndefined();
  });
});
