import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { OpenMembershipCommand } from "./command.ts";
import type { MembershipRepository } from "@examples/modules/membership/core/repository.ts";
import { decideOpenMembership } from "./decide.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import type { StageIntents } from "@adapters/outbound/capabilities/StageIntents.ts";
import type { NotifyUserToVerifyEmail } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import { isRejection } from "@examples/shared/utils/isRejection.ts";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  Promise<void | GatewayFailure[] | Rejection>
> {
  constructor(
    private readonly repository: MembershipRepository,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmail,
      AsyncIterable<void | GatewayFailure>
    >,
  ) {}

  async handle(command: OpenMembershipCommand): Promise<void | GatewayFailure[] | Rejection> {
    const result = await this.repository.load(command.payload.membershipId);
    if (isFailure(result)) return [result];

    const currentState = result;
    const decision = decideOpenMembership(currentState, command);

    if (isRejection(decision)) return decision.rejection;

    const repositoryResult = await Array.fromAsync(this.repository.store(decision.events));
    const outboxResult = await Array.fromAsync(this.outbox.stage(decision.intents));

    if (repositoryResult.concat(outboxResult).some(isFailure))
      return repositoryResult.concat(outboxResult).filter(isFailure);
  }
}
