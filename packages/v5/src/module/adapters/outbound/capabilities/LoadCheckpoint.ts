import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface LoadCheckpoint<TResult = Promise<number | GatewayFailure>> {
  loadCheckpoint(): TResult;
}
