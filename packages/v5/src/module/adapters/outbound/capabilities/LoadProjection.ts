import type { GatewayFailure } from '../shapes/GatewayFailure.ts';

export interface LoadProjection<TState, TResult = Promise<TState | GatewayFailure>> {
  load(): TResult;
}
