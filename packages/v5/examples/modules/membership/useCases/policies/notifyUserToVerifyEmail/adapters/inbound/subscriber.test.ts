import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { RegisterIntentSubscriber } from "@adapters/outbound/capabilities/RegisterIntentSubscriber.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import { NotifyUserToVerifyEmailHandler } from "../../handler.ts";
import { subscribeNotifyUserToVerifyEmail } from "./subscriber.ts";

class RecordingRelay implements RegisterIntentSubscriber<MembershipIntents> {
  public readonly calls: Array<{ type: string; handler: HandleIntent<MembershipIntents> }> = [];
  subscribe<T extends MembershipIntents>(intentType: T["type"], handler: HandleIntent<T>): void {
    this.calls.push({ type: intentType, handler: handler as HandleIntent<MembershipIntents> });
  }
}

describe("subscribeNotifyUserToVerifyEmail", () => {
  it("should subscribe a NotifyUserToVerifyEmailHandler under the v1 intent type", () => {
    const relay = new RecordingRelay();
    const email = new InMemoryEmailGateway();

    subscribeNotifyUserToVerifyEmail(relay, { email });

    expect(relay.calls).toHaveLength(1);
    expect(relay.calls[0]?.type).toBe("NotifyUserToVerifyEmail.v1");
    expect(relay.calls[0]?.handler).toBeInstanceOf(NotifyUserToVerifyEmailHandler);
  });
});
