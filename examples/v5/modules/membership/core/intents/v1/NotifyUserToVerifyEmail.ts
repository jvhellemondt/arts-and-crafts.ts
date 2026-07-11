import type { Intent } from "@arts-and-crafts/v5/core/shapes";

type NotifyUserToVerifyEmailV1Payload = {
  email: string;
  name: string;
};

export interface NotifyUserToVerifyEmailV1 extends Intent<
  "NotifyUserToVerifyEmail.v1",
  NotifyUserToVerifyEmailV1Payload
> {}
