import { MembershipDoesNotAlreadyExist } from "./MembershipDoesNotAlreadyExist.ts";
import type { OpenMembershipState } from "../state.ts";

describe("MembershipDoesNotAlreadyExist", () => {
  const spec = new MembershipDoesNotAlreadyExist();

  it("should not be satisfied when the membership already exists", () => {
    const state: OpenMembershipState = { exists: true };
    expect(spec.isSatisfiedBy(state)).toBe(false);
  });

  it("should be satisfied when the membership does not exist", () => {
    const state: OpenMembershipState = { exists: false };
    expect(spec.isSatisfiedBy(state)).toBe(true);
  });
});
