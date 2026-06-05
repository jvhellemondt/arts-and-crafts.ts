export interface Rejection<TCode = string> {
  readonly type: 'rejection';
  readonly code: TCode;
  readonly reason: string;
  readonly validationErrors?: {
    readonly code: string;
    readonly field?: string;
    readonly message?: string;
    readonly expected?: string;
  }[];
}
