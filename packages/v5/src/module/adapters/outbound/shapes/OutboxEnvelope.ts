import type { Intent } from "@core/shapes/Intent.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";

export type OutboxEnvelope<TEntry extends Intent | Notification> = {
  status: "pending" | "dispatched" | "failed";
  readonly stagedAt: number;
  attemptCount: number;
  dispatchedAt?: number;
  failedAt?: number;
  lastError?: string;
  readonly entry: TEntry;
};
