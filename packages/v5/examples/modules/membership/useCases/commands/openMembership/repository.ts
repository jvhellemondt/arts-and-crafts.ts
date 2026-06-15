import type { MembershipEventV1 } from "./events/index.ts";
import type { StoreDomainEvents } from "@core/capabilities/StoreDomainEvents.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { LoadDecisionState } from "@core/capabilities/LoadDecisionState.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import type { AppendToEventStore } from "@adapters/outbound/capabilities/AppendToEventStore.ts";
import { evolveMembership } from "./evolve.ts";
import type { MembershipState } from "./state.ts";

export class MembershipRepository
  implements
    LoadDecisionState<MembershipEventV1, Promise<MembershipState | GatewayFailure>>,
    StoreDomainEvents<MembershipEventV1, Promise<void | GatewayFailure>>
{
  private readonly streamName: string = "Membership";

  constructor(
    private readonly eventStore: LoadDomainEvents<
      MembershipEventV1,
      Promise<MembershipEventV1[] | GatewayFailure>
    > &
      AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  ) {}

  async load(aggregateId: string): Promise<MembershipState | GatewayFailure> {
    const result = await this.eventStore.load(this.streamName, aggregateId);
    if (!Array.isArray(result)) return result;
    return evolveMembership(aggregateId, result);
  }

  async store(events: MembershipEventV1[]): Promise<void | GatewayFailure> {
    await this.eventStore.append(events);
  }
}
