import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";

export interface MarkIntentDispatched<TResult = Promise<void | GatewayFailure>> {
  markDispatched(intentId: string): TResult;
}
