export interface RelayPendingIntents<TResult = Promise<void>> {
  relay(): TResult;
}
