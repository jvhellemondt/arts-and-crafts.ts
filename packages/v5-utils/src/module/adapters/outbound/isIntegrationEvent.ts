import type { IntegrationEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";

export function isIntegrationEvent(value: unknown): value is IntegrationEvent {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.kind === "integration" &&
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.timestamp === "number" &&
    typeof candidate.metadata === "object" &&
    candidate.metadata !== null
  );
}
