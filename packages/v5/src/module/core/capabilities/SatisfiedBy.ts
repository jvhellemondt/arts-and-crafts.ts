export interface SatisfiedBy<TState> {
  isSatisfiedBy(state: TState): boolean;
}
