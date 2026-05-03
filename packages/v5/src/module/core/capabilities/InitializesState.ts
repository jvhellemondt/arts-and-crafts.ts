export interface InitializesState<TState> {
  initialize(id: string): TState;
}
