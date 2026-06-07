import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { ReadEvents } from "@adapters/outbound/capabilities/ReadEvents.ts";
import type { AppendCondition } from "@adapters/outbound/shapes/AppendCondition.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { LoadedState, Repository } from "@core/capabilities/Repository.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { evolveOpenMembership, initialOpenMembershipState, type OpenMembershipState } from "./state.ts";

/**
 * The repository for the open-membership command. It reads the command's
 * boundary into the slice's own {@link OpenMembershipState} and appends new
 * events under the append condition derived from the read position.
 */
export class OpenMembershipRepository
  implements Repository<OpenMembershipState, MembershipEventV1>
{
  constructor(
    private readonly eventStore: ReadEvents<MembershipEventV1> &
      AppendToEventStream<MembershipEventV1, Promise<void | GatewayFailure | AppendConflict>>,
  ) {}

  async load(query: DcbQuery): Promise<LoadedState<OpenMembershipState> | GatewayFailure> {
    const result = await this.eventStore.read(query);
    if (isFailure(result)) return result;

    const state = result.events.reduce(evolveOpenMembership, initialOpenMembershipState);
    return { state, position: result.position };
  }

  async store(
    events: MembershipEventV1[],
    condition: AppendCondition,
  ): Promise<void | GatewayFailure | AppendConflict> {
    return this.eventStore.append(events, condition);
  }
}
