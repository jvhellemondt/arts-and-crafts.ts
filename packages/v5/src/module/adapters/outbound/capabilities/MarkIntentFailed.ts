import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface MarkIntentFailed<TResult = Promise<void | GatewayFailure>> {
  markFailed(intentId: string, reason: string): TResult;
}
