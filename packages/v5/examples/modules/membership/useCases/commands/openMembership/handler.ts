import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { isRejection } from "@examples/shared/utils/isRejection.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import { buildOpenMembershipQuery } from "./query.ts";
import type { OpenMembershipRepository } from "./repository.ts";

type OpenMembershipResult = (GatewayFailure | AppendConflict)[] | Rejection;

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  Promise<OpenMembershipResult>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmailV1,
      Promise<void | GatewayFailure>
    >,
  ) {}

  async handle(command: OpenMembershipCommand): Promise<OpenMembershipResult> {
    const query = buildOpenMembershipQuery(command);

    const loaded = await this.repository.load(query);
    if (isFailure(loaded)) return [loaded];

    const decision = decideOpenMembership(loaded.state, command);
    if (isRejection(decision)) return decision.rejection;

    const appendResult = await this.repository.store(decision.events, {
      query,
      after: loaded.position,
    });
    const outboxResult = await this.outbox.stage(decision.intents);

    return [appendResult, outboxResult].filter(isFailure);
  }
}
