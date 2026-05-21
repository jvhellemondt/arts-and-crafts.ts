import type { Intent } from "@core/shapes/Intent.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";

export type OutboxEnvelope<TEntry extends Intent | Notification> = {
  readonly status: "pending" | "dispatched" | "failed";
  readonly stagedAt: number;
  readonly attemptCount: number;
  readonly dispatchedAt?: number;
  readonly failedAt?: number;
  readonly lastError?: string;
  readonly entry: TEntry;
};
