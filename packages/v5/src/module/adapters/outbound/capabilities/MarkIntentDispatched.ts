import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface MarkIntentDispatched<TResult = Promise<void | GatewayFailure>> {
  markDispatched(intentId: string): TResult;
}
