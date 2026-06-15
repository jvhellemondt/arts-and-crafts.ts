import type { DecisionState } from "../decisionState.ts";
import { MembershipDoesNotAlreadyExist } from "./MembershipDoesNotAlreadyExist.ts";
import { v7 as uuidv7 } from "uuid";

describe("MembershipDoesNotAlreadyExist", () => {
  const spec = new MembershipDoesNotAlreadyExist();
  const id = uuidv7();
  const payload = { name: "Jane Doe", email: "jane@example.com" };

  it.each<{ state: DecisionState }>([{ state: { status: "open", id, ...payload } }])(
    "should not be satisfied when status is '$state.status'",
    ({ state }) => {
      expect(spec.isSatisfiedBy(state)).toBe(false);
    },
  );

  it("should be satisfied when status is 'initial'", () => {
    const state: DecisionState = { status: "initial", id };
    expect(spec.isSatisfiedBy(state)).toBe(true);
  });
});
