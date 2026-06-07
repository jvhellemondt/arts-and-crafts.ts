import type { Tag } from "@core/shapes/Tag.ts";
import { subjectOf } from "./subjectOf.ts";

describe("subjectOf", () => {
  const tags: Tag[] = [
    { key: "membership", value: "m-1" },
    { key: "tenant", value: "acme" },
  ];

  it("returns the value of the first tag with the given key", () => {
    expect(subjectOf(tags, "membership")).toBe("m-1");
  });

  it("returns undefined when no tag has the given key", () => {
    expect(subjectOf(tags, "unknown")).toBeUndefined();
  });
});
