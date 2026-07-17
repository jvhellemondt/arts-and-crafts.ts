import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { OutboxEnvelope } from "../shapes/OutboxEnvelope.ts";
import type { Intent } from "../../../core/shapes/Intent.ts";

export interface LoadPendingIntents<
  TIntent extends Intent,
  TResult = Promise<OutboxEnvelope<TIntent>[] | GatewayFailure>,
> {
  loadPending(limit?: number): TResult;
}
