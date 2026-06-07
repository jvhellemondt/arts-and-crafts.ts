/**
 * Returned when an {@link AppendCondition} is violated: an event matching the
 * writer's boundary was appended after the position it read. Distinct from
 * `GatewayFailure`, which models infrastructure unavailability rather than a
 * lost optimistic-concurrency race.
 */
export interface AppendConflict {
  readonly kind: "failure";
  readonly code: "APPEND_CONDITION_FAILED";
  readonly reason: string;
}
