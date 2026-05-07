export type Rejection<TCode extends string = string> = {
  readonly code: TCode;
  readonly reason: string;
};
