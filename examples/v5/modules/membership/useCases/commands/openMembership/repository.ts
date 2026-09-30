import type {
  DynamicConsistencyResult,
  GatewayFailure,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { LoadDecisionState } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type { LoadDomainEvents } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { ResultAsync } from "neverthrow";
import type { DecisionState } from "./decisionState.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import { evolveOpenMembership } from "./evolve.ts";

export class OpenMembershipRepository implements LoadDecisionState<
  MembershipEventV1,
  ResultAsync<DecisionState, GatewayFailure>
> {
  constructor(
    private readonly eventStore: LoadDomainEvents<
      MembershipEventV1,
      ResultAsync<DynamicConsistencyResult<MembershipEventV1>, GatewayFailure>
    >,
  ) {}

  load(membershipId: string, email: string): ResultAsync<DecisionState, GatewayFailure> {
    const streamKeys = [
      createStreamKey(ANCHOR_MEMBERSHIP, membershipId),
      createStreamKey("EmailRegistration", email),
    ];
    return this.eventStore
      .load(streamKeys)
      .map(({ events }) => evolveOpenMembership(membershipId, events));
  }
}
