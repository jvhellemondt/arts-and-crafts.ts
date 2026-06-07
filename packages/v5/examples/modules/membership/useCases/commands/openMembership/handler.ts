import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { StageIntents } from "@core/capabilities/StageIntents.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import type { MembershipDecisionModel } from "@examples/modules/membership/core/decisionModel.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { isRejection } from "@examples/shared/utils/isRejection.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import { buildOpenMembershipQuery } from "./query.ts";

type OpenMembershipResult = (GatewayFailure | AppendConflict)[] | Rejection;

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  Promise<OpenMembershipResult>
> {
  constructor(
    private readonly decisionModel: MembershipDecisionModel,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmailV1,
      Promise<void | GatewayFailure>
    >,
  ) {}

  async handle(command: OpenMembershipCommand): Promise<OpenMembershipResult> {
    const query = buildOpenMembershipQuery(command);

    const model = await this.decisionModel.build(query);
    if (isFailure(model)) return [model];

    const decision = decideOpenMembership(model.state, command);
    if (isRejection(decision)) return decision.rejection;

    const appendResult = await this.decisionModel.store(decision.events, {
      query,
      after: model.position,
    });
    const outboxResult = await this.outbox.stage(decision.intents);

    return [appendResult, outboxResult].filter(isFailure);
  }
}
