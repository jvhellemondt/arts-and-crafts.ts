import type { Failure } from "@core/shapes/Failure.ts";
import type { Message } from "@core/shapes/Message.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";

export interface Notification<
  TType = string,
  TPayload = unknown,
  TCode = string,
  TDetails = Rejection<TCode> | Failure<TCode>,
> extends Message<TType, TPayload> {
  readonly kind: "failure" | "rejection";
  readonly details: TDetails;
  readonly commandType: string;
  readonly commandId: string;
}
