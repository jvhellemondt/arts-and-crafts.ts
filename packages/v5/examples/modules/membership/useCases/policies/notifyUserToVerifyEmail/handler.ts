import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { EmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";

export class NotifyUserToVerifyEmailHandler
  implements HandleIntent<NotifyUserToVerifyEmailV1>
{
  constructor(private readonly email: EmailGateway) {}

  async handle(input: NotifyUserToVerifyEmailV1): Promise<void> {
    await this.email.send({
      to: input.payload.email,
      subject: "Please verify your email",
      body: `Hi ${input.payload.name}, click to verify your email.`,
      idempotencyKey: input.id,
    });
  }
}
