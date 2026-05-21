export type WithIdentifier<T = object> = {
  readonly id: string;
} & T;
