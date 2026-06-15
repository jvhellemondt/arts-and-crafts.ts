import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";

export interface LoadDecisionState<TState, TReturn = Promise<TState>> {
  load(criteria: readonly StreamKey[]): TReturn;
}
