import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { OutboxEnvelope } from "@adapters/outbound/shapes/OutboxEnvelope.ts";
import type { Intent } from "@core/shapes/Intent.ts";

export interface LoadPendingIntents<
  TIntent extends Intent,
  TResult = Promise<OutboxEnvelope<TIntent>[] | GatewayFailure>,
> {
  loadPending(limit?: number): TResult;
}
