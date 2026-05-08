export interface HandleQuery<TQuery, TData = Promise<object>> {
  handle(input: TQuery): TData;
}
