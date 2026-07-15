import type { Failure } from "@arts-and-crafts/v5/core/shapes";

export function isFailure(value: unknown): value is Failure {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "failure";
}
