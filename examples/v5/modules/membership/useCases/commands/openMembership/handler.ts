import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { AppendEventsAndIntents } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRepository } from "./repository.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import { type ResultAsync, okAsync } from "neverthrow";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  ResultAsync<OpenMembershipDecision, GatewayFailure[]>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly writer: AppendEventsAndIntents<
      MembershipOpenedV1,
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
          ? this.writer
              .appendEventsAndIntents(decision.events, decision.intents)
              .mapErr((failure): GatewayFailure[] => [failure])
              .map(() => decision)
          : okAsync(decision),
      );
  }
}
