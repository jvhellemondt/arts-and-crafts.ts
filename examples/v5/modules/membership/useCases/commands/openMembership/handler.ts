import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type {
  PersistEventsAndIntents,
  StageNotifications,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRepository } from "./repository.ts";
import type { OpenMembershipDecision } from "./decision.ts";
import type {
  MembershipAlreadyExists,
  OpenMembershipRejected,
} from "./rejections/MembershipAlreadyExists.ts";
import { type ResultAsync } from "neverthrow";
import { v7 as uuidv7 } from "uuid";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  ResultAsync<OpenMembershipDecision, GatewayFailure[]>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly writer: PersistEventsAndIntents<
      MembershipOpenedV1,
      NotifyUserToVerifyEmailV1,
      ResultAsync<void, GatewayFailure>
    >,
    private readonly notifications: StageNotifications<
      OpenMembershipRejected,
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
              .persist(decision)
              .mapErr((failure): GatewayFailure[] => [failure])
              .map(() => decision)
          : this.notifications
              .stage([this.toRejectedNotification(command, decision.rejection)])
              .mapErr((failure): GatewayFailure[] => [failure])
              .map(() => decision),
      );
  }

  private toRejectedNotification(
    command: OpenMembershipCommand,
    rejection: MembershipAlreadyExists,
  ): OpenMembershipRejected {
    return {
      kind: "notification",
      type: "OpenMembershipRejected",
      payload: command.payload,
      id: uuidv7(),
      timestamp: Date.now(),
      metadata: command.metadata,
      commandType: command.type,
      commandId: command.id,
      details: rejection,
    };
  }
}
