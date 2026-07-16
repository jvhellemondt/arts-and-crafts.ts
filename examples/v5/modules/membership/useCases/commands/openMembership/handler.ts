import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRepository } from "./repository.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import { ResultAsync, okAsync } from "neverthrow";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  ResultAsync<OpenMembershipDecision, GatewayFailure[]>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmailV1,
      ResultAsync<void, GatewayFailure>
    >,
  ) {}

  handle(command: OpenMembershipCommand): ResultAsync<OpenMembershipDecision, GatewayFailure[]> {
    return this.repository
      .load(command.payload.membershipId, command.payload.email)
      .mapErr((failure): GatewayFailure[] => [failure])
      .map((state) => decideOpenMembership(state, command))
      .andThen((decision) =>
        decision.accepted
          ? ResultAsync.combineWithAllErrors([
              this.repository.store(decision.events),
              this.outbox.stage(decision.intents),
            ]).map(() => decision)
          : okAsync(decision),
      );
  }
}
