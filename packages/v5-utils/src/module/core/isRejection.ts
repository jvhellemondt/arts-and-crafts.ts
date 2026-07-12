import type { Rejection } from "@arts-and-crafts/v5/core/shapes";

export function isRejection(value: unknown): value is Rejection {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "rejection"
  );
}
