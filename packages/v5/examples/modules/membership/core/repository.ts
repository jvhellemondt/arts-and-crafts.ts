import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import type { MembershipEventV1 } from "./events/index.ts";
import type { StoreDomainEvents } from "@core/capabilities/StoreDomainEvents.ts";
import type { MembershipOpenedV1 } from "./events/v1/MembershipOpenedV1.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";

export class MembershipRepository
  implements
    LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>>,
    StoreDomainEvents<MembershipEventV1>
{
  private readonly streamName: string = "membership";

  constructor(
    private readonly eventStore: LoadDomainEvents<
      MembershipEventV1,
      Promise<MembershipEventV1[] | GatewayFailure>
    > &
      AppendToEventStream<MembershipEventV1, Promise<void | GatewayFailure>>,
  ) {}

  async load(aggregateId: string): Promise<MembershipEventV1[] | GatewayFailure> {
    return this.eventStore.load(this.streamName, aggregateId);
  }

  async store(events: MembershipOpenedV1[]): Promise<void> {
    await Promise.all(
      events.map((event) => this.eventStore.append(this.streamName, event.aggregateId, [event])),
    );
  }
}
