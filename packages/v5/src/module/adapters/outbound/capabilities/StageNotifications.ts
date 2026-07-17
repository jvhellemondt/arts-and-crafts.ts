import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { Notification } from "../shapes/Notification.ts";

export interface StageNotifications<
  TNotification extends Notification,
  TResult = Promise<void | GatewayFailure>,
> {
  stage(notifications: TNotification[]): TResult;
}
