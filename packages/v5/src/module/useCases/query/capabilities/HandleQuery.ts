import type { Query } from '../shapes/Query.ts';

export interface HandleQuery<TQuery extends Query, TData = Promise<object>> {
  handle(input: TQuery): TData;
}
