import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import type { Decision, Rejected } from "@useCases/command/shapes/Decision.ts";

export function isRejection<TRejection extends Rejection>(
  value: Decision<DomainEvent, Intent, TRejection>,
): value is Rejected<TRejection> {
  return !value.accepted;
}
