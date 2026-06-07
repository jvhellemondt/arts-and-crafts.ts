import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { ReadEvents } from "@adapters/outbound/capabilities/ReadEvents.ts";
import type { AppendCondition } from "@adapters/outbound/shapes/AppendCondition.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { BuildDecisionModel, DecisionModel } from "@core/capabilities/BuildDecisionModel.ts";
import type { StoreDomainEvents } from "@core/capabilities/StoreDomainEvents.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { subjectOf } from "@examples/shared/utils/subjectOf.ts";
import type { MembershipEventV1 } from "./events/index.ts";
import { evolveMembership } from "./evolve.ts";
import { MEMBERSHIP_TAG_KEY, type MembershipState } from "./state.ts";

/**
 * The membership decision model: the DCB replacement for an aggregate
 * repository. `build` reads the events inside the boundary described by `query`
 * and folds them into a {@link MembershipState} with the position they were read
 * at; `store` appends new events under the supplied append condition.
 */
export class MembershipDecisionModel
  implements
    BuildDecisionModel<MembershipState, Promise<DecisionModel<MembershipState> | GatewayFailure>>,
    StoreDomainEvents<MembershipEventV1, Promise<void | GatewayFailure | AppendConflict>>
{
  constructor(
    private readonly eventStore: ReadEvents<MembershipEventV1> &
      AppendToEventStream<
        MembershipEventV1,
        Promise<void | GatewayFailure | AppendConflict>
      >,
  ) {}

  async build(query: DcbQuery): Promise<DecisionModel<MembershipState> | GatewayFailure> {
    const result = await this.eventStore.read(query);
    if (isFailure(result)) return result;

    const id =
      subjectOf(
        query.criteria.flatMap((criterion) => criterion.tags),
        MEMBERSHIP_TAG_KEY,
      ) ?? "";
    return { state: evolveMembership(id, [...result.events]), position: result.position };
  }

  async store(
    events: MembershipEventV1[],
    condition?: AppendCondition,
  ): Promise<void | GatewayFailure | AppendConflict> {
    return this.eventStore.append(events, condition);
  }
}
