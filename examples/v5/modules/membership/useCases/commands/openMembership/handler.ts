import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import { isRejection } from "@examples/shared/utils/isRejection.ts";
import type { OpenMembershipRepository } from "./repository.ts";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  Promise<GatewayFailure[] | Rejection>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmailV1,
      Promise<void | GatewayFailure>
    >,
  ) {}

  async handle(command: OpenMembershipCommand): Promise<GatewayFailure[] | Rejection> {
    const result = await this.repository.load(command.payload.membershipId, command.payload.email);
    if (isFailure(result)) return [result];

    const currentState = result;
    const decision = decideOpenMembership(currentState, command);

    if (isRejection(decision)) return decision.rejection;

    const repositoryResult = await this.repository.store(decision.events);
    const outboxResult = await this.outbox.stage(decision.intents);

    return [repositoryResult, outboxResult].filter(isFailure);
  }
}
