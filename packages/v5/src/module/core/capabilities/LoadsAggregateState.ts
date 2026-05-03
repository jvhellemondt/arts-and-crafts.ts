export interface LoadsAggregateState<TState, TReturn = Promise<TState>> {
  load(aggregateId: string): TReturn;
}
