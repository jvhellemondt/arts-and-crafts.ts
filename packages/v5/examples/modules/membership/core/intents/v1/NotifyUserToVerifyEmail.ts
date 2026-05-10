import type { Intent } from "@core/shapes/Intent.ts";

type NotifyUserToVerifyEmailV1Payload = {
  aggregateId: string;
  email: string;
  name: string;
};

export interface NotifyUserToVerifyEmailV1 extends Intent<
  "NotifyUserToVerifyEmail.v1",
  NotifyUserToVerifyEmailV1Payload
> {}
