/**
 * The read side of CQRS: a side-effect-free handler that takes the query
 * criteria (its payload) and returns data. A query is not persisted or
 * published, so it needs no message envelope — the payload is the query.
 */
export interface HandleQuery<TPayload = unknown, TResult = Promise<object>> {
  handle(payload: TPayload): TResult;
}
