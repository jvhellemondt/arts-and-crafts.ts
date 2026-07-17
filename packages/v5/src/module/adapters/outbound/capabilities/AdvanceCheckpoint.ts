import type { GatewayFailure } from '../shapes/GatewayFailure.ts';

export interface AdvanceCheckpoint<TResult = Promise<void | GatewayFailure>> {
  advanceCheckpoint(position: number): TResult;
}
