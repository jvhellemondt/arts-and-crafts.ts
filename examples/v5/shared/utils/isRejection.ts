import type { DomainEvent, Intent, Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { Decision, Rejected } from "@arts-and-crafts/v5/useCases/command/shapes";

export function isRejection<TRejection extends Rejection>(
  value: Decision<DomainEvent, Intent, TRejection>,
): value is Rejected<TRejection> {
  return !value.accepted;
}
