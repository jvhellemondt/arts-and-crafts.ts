import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { EmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import { NotifyUserToVerifyEmailHandler } from "../../handler.ts";

export const registerNotifyUserToVerifyEmail = (
  handlers: Map<string, HandleIntent<MembershipIntents>>,
  deps: { email: EmailGateway },
): void => {
  handlers.set(
    "NotifyUserToVerifyEmail.v1",
    new NotifyUserToVerifyEmailHandler(deps.email),
  );
};
