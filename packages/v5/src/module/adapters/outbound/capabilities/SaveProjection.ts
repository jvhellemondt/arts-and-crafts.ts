import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface SaveProjection<TState, TResult = Promise<void | GatewayFailure>> {
  save(state: TState): TResult;
}
