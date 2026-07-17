import type { Message } from '../../../core/shapes/Message.ts';

export interface Query<TType = string, TPayload = unknown> extends Message<TType, TPayload> {
  readonly kind: 'query';
}
