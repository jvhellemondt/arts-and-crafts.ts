export interface InitializeState<TState> {
  initialize(id: string): TState;
}
