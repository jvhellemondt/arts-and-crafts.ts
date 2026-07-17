/**
 * The read side of CQRS: a side-effect-free handler that takes the query
 * criteria and returns data. A query is not persisted or published, so it
 * needs no message envelope — the criteria object is the query.
 */
export interface HandleQuery<TQuery = unknown, TResult = Promise<object>> {
  handle(query: TQuery): TResult;
}
