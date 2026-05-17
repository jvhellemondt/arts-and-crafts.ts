import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import { NotifyUserToVerifyEmailHandler } from "../../handler.ts";
import { registerNotifyUserToVerifyEmail } from "./subscriber.ts";

describe("registerNotifyUserToVerifyEmail", () => {
  it("should register a NotifyUserToVerifyEmailHandler under the v1 intent type", () => {
    const handlers = new Map<string, HandleIntent<MembershipIntents>>();
    const email = new InMemoryEmailGateway();

    registerNotifyUserToVerifyEmail(handlers, { email });

    expect(handlers.get("NotifyUserToVerifyEmail.v1")).toBeInstanceOf(
      NotifyUserToVerifyEmailHandler,
    );
  });

  it("should not overwrite handlers for other intent types", () => {
    const otherHandler: HandleIntent<MembershipIntents> = { handle: async () => {} };
    const handlers = new Map<string, HandleIntent<MembershipIntents>>([
      ["Other.v1", otherHandler],
    ]);

    registerNotifyUserToVerifyEmail(handlers, { email: new InMemoryEmailGateway() });

    expect(handlers.get("Other.v1")).toBe(otherHandler);
    expect(handlers.size).toBe(2);
  });
});
