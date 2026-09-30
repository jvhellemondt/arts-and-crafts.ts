import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";

export function isDomainEvent(value: unknown): value is DomainEvent {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.kind === "domain" &&
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.timestamp === "number" &&
    Array.isArray(candidate.concerns) &&
    typeof candidate.metadata === "object" &&
    candidate.metadata !== null
  );
}
