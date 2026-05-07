import { MembershipDoesNotAlreadyExist } from "./MembershipDoesNotAlreadyExist.ts";
import type { MembershipState } from "@examples/modules/membership/core/state.ts";
import { v7 as uuidv7 } from "uuid";

describe("MembershipDoesNotAlreadyExist", () => {
  const spec = new MembershipDoesNotAlreadyExist();
  const id = uuidv7();
  const payload = { name: "Jane Doe", email: "jane@example.com" };

  it.each<{ state: MembershipState }>([
    { state: { status: "open", id, ...payload } },
    { state: { status: "active", id, ...payload } },
    { state: { status: "closed", id } },
  ])("should not be satisfied when status is '$state.status'", ({ state }) => {
    expect(spec.isSatisfiedBy(state)).toBe(false);
  });

  it("should be satisfied when status is 'initial'", () => {
    const state: MembershipState = { status: "initial", id };
    expect(spec.isSatisfiedBy(state)).toBe(true);
  });
});
