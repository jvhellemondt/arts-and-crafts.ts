export interface InitializeState<TState> {
  /**
   * The empty decision state, before any events are folded in. Identity-free:
   * the subject is supplied by the folded events, not by the initial state.
   */
  initialize(): TState;
}
