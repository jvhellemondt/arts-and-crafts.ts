import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { PersistDecision } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRepository } from "./repository.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import type { MembershipAlreadyExists } from "./rejections/MembershipAlreadyExists.ts";
import { type ResultAsync } from "neverthrow";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  ResultAsync<OpenMembershipDecision, GatewayFailure>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly writer: PersistDecision<
      OpenMembershipCommand,
      MembershipOpenedV1,
      NotifyUserToVerifyEmailV1,
      MembershipAlreadyExists,
      ResultAsync<void, GatewayFailure>
    >,
  ) {}

  handle(command: OpenMembershipCommand): ResultAsync<OpenMembershipDecision, GatewayFailure> {
    return this.repository
      .load(command.payload.membershipId, command.payload.email)
      .map((state) => decideOpenMembership(state, command))
      .andThen((decision) => this.writer.persist(decision, command).map(() => decision));
  }
}
