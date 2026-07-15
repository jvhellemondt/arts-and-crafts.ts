import type { HandleCommand } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { OpenMembershipCommand } from "./command.ts";
import { decideOpenMembership } from "./decide.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { isRejection } from "@examples/shared/utils/isRejection.ts";
import type { OpenMembershipRepository } from "./repository.ts";
import { errAsync, fromSafePromise, okAsync, ResultAsync } from "neverthrow";

export class OpenMembershipHandler implements HandleCommand<
  OpenMembershipCommand,
  ResultAsync<void, GatewayFailure[] | Rejection>
  // Promise<GatewayFailure[] | Rejection>
> {
  constructor(
    private readonly repository: OpenMembershipRepository,
    private readonly outbox: StageIntents<
      NotifyUserToVerifyEmailV1,
      Promise<void | GatewayFailure>
    >,
  ) {}

  // async handle(command: OpenMembershipCommand): Promise<GatewayFailure[] | Rejection> {
  //   const result = await this.repository.load(command.payload.membershipId, command.payload.email);
  //   if (isFailure(result)) return [result];

  //   const currentState = result;
  //   const decision = decideOpenMembership(currentState, command);

  //   if (isRejection(decision)) return decision.rejection;

  //   const repositoryResult = await this.repository.store(decision.events);
  //   const outboxResult = await this.outbox.stage(decision.intents);

  //   return [repositoryResult, outboxResult].filter(isFailure);
  // }

  handle(command: OpenMembershipCommand): ResultAsync<void, GatewayFailure[] | Rejection> {
    return fromSafePromise(
      this.repository.load(command.payload.membershipId, command.payload.email),
    )
      .andThen((loadResult) => {
        if (isFailure(loadResult)) return errAsync([loadResult]);
        return okAsync(decideOpenMembership(loadResult, command));
      })
      .andThen((decision) => {
        if (isRejection(decision)) return errAsync(decision.rejection);
        return okAsync(decision);
      })
      .andThen((decision) => {
        return ResultAsync.combine([
          fromSafePromise(this.repository.store(decision.events)),
          fromSafePromise(this.outbox.stage(decision.intents)),
        ]);
      })
      .andThen((combi) => {
        const failures = combi.filter(isFailure);
        if (failures.length) return errAsync(combi.filter(isFailure));
        return okAsync();
      });
  }
}
