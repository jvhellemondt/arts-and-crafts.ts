import type { RegisterIntentSubscriber } from "@adapters/outbound/capabilities/RegisterIntentSubscriber.ts";
import type { EmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import { NotifyUserToVerifyEmailHandler } from "../../handler.ts";

export const subscribeNotifyUserToVerifyEmail = (
  relay: RegisterIntentSubscriber<MembershipIntents>,
  deps: { email: EmailGateway },
): void => {
  relay.subscribe(
    "NotifyUserToVerifyEmail.v1",
    new NotifyUserToVerifyEmailHandler(deps.email),
  );
};
