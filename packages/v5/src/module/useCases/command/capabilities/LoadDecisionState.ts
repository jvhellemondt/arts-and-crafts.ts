export interface LoadDecisionState<TState, TReturn = Promise<TState>> {
  load(id: string, ...otherIds: string[]): TReturn;
}
