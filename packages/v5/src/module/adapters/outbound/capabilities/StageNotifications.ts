import type { Notification } from "@adapters/outbound/shapes/Notification.ts";

export interface StageNotifications<TNotification extends Notification, TResult = Promise<void>> {
  stage(notifications: TNotification[]): TResult;
}
