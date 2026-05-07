export interface HandleCommands<TCommand, TResult = Promise<void>> {
  handle(input: TCommand): TResult;
}
