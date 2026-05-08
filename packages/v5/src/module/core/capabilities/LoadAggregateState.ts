export interface LoadAggregateState<TState, TReturn = Promise<TState>> {
  load(aggregateId: string): TReturn;
}
