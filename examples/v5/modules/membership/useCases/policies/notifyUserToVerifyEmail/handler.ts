import type { HandleIntent } from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type { EmailGateway } from "../../../../../shared/adapters/outbound/EmailGateway.ts";
import type { NotifyUserToVerifyEmailV1 } from "../../../core/intents/v1/NotifyUserToVerifyEmail.ts";

export class NotifyUserToVerifyEmailHandler implements HandleIntent<NotifyUserToVerifyEmailV1> {
  private readonly email: EmailGateway;

  constructor(email: EmailGateway) {
    this.email = email;
  }

  async handle(input: NotifyUserToVerifyEmailV1): Promise<void> {
    await this.email.send({
      to: input.payload.email,
      subject: "Please verify your email",
      body: `Hi ${input.payload.name}, click to verify your email.`,
      idempotencyKey: input.id,
    });
  }
}
