import type { Intent } from "@core/shapes/Intent.ts";

type NotifyUserToVerifyEmailPayload = {
  aggregateId: string;
  email: string;
  name: string;
};

export interface NotifyUserToVerifyEmail extends Intent<
  "NotifyUserToVerifyEmail",
  NotifyUserToVerifyEmailPayload
> {}
