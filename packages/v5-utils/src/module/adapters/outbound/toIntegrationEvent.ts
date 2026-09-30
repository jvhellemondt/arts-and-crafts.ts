import type { IntegrationEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";

/**
 * Maps a domain event onto the integration event that leaves the bounded
 * context, dropping the fields that mean nothing outside it: `concerns`,
 * `commandId` and `commandType`.
 */
export function toIntegrationEvent<TType, TPayload>(
  event: DomainEvent<TType, TPayload>,
): IntegrationEvent<TType, TPayload> {
  const { concerns: _concerns, commandId: _commandId, commandType: _commandType, ...rest } = event;

  return { ...rest, kind: "integration" };
}
