import type { StoreDomainEvents } from "@arts-and-crafts/v5/core/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { LoadDecisionState } from "@arts-and-crafts/v5/useCases/command/capabilities";
import type {
  LoadDomainEvents,
  AppendToEventStore,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { MembershipEventV1 } from "../../../core/events/index.ts";
import type { DecisionState } from "./decisionState.ts";
import { createStreamKey } from "../../../../../shared/utils/createStreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "../../../core/anchors.ts";
import { evolveOpenMembership } from "./evolve.ts";

type MembershipEventStore = LoadDomainEvents<
  MembershipEventV1,
  Promise<MembershipEventV1[] | GatewayFailure>
> &
  AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>;

export class OpenMembershipRepository
  implements
    LoadDecisionState<MembershipEventV1, Promise<DecisionState | GatewayFailure>>,
    StoreDomainEvents<MembershipEventV1, Promise<void | GatewayFailure>>
{
  private readonly eventStore: MembershipEventStore;

  constructor(eventStore: MembershipEventStore) {
    this.eventStore = eventStore;
  }

  async load(membershipId: string, email: string): Promise<DecisionState | GatewayFailure> {
    const streamKeys = [
      createStreamKey(ANCHOR_MEMBERSHIP, membershipId),
      createStreamKey("EmailRegistration", email),
    ];
    const result = await this.eventStore.load(streamKeys);
    if (!Array.isArray(result)) return result;
    return evolveOpenMembership(membershipId, result);
  }

  async store(events: MembershipEventV1[]): Promise<void | GatewayFailure> {
    await this.eventStore.append(events);
  }
}
