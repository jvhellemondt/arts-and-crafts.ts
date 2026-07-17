import type { Failure } from '../../../core/shapes/Failure.ts';
import type { Message } from '../../../core/shapes/Message.ts';
import type { Rejection } from '../../../core/shapes/Rejection.ts';

type NotificationContext<TType, TPayload> = Message<TType, TPayload> & {
  readonly commandType: string;
  readonly commandId: string;
};

export type Notification<TType = string, TPayload = unknown, TCode = string> = NotificationContext<
  TType,
  TPayload
> & {
  readonly kind: 'notification';
  readonly details: Failure<TCode> | Rejection<TCode>;
};
