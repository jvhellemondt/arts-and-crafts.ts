import type { Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { Command } from "@arts-and-crafts/v5/useCases/command/shapes";
import { v7 as uuidv7 } from "uuid";

/**
 * Builds a caller notification from a rejected command, following the
 * `${command.type}Rejected` naming convention (e.g. `OpenMembership` ->
 * `OpenMembershipRejected`). Every field is derived mechanically from
 * `command` and `rejection` — nothing adapter-specific is needed, so any
 * writer can stage the result the same way regardless of its backing store.
 */
export function toRejectionNotification<TNotification extends Notification>(
  command: Command,
  rejection: Rejection,
): TNotification {
  return {
    kind: "notification",
    type: `${command.type}Rejected`,
    payload: command.payload,
    id: uuidv7(),
    timestamp: Date.now(),
    metadata: command.metadata,
    commandType: command.type,
    commandId: command.id,
    details: rejection,
  } as unknown as TNotification;
}
