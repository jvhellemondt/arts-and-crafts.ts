import type { Intent } from "@core/shapes/Intent.ts";

export type OutboxEnvelope<TIntent extends Intent> = {
  status: "pending" | "dispatched" | "failed";
  stagedAt: number;
  dispatchedAt?: number;
  intent: TIntent;
};
