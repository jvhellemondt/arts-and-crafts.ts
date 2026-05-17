import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { SaveProjection } from "@adapters/outbound/capabilities/SaveProjection.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { apply, type ListMembershipsProjection } from "./projection.ts";

export class ListMembershipsProjector implements ConsumeEvents<MembershipEventV1> {
  constructor(
    private readonly store: LoadProjection<ListMembershipsProjection> &
      SaveProjection<ListMembershipsProjection>,
  ) {}

  start(bus: RegisterEventSubscriber<MembershipEventV1>): void {
    bus.subscribe("Membership", this);
  }

  async consume(event: MembershipEventV1): Promise<void> {
    const current = await this.store.load();
    if (isFailure(current)) return;
    const next = apply(current, event);
    await this.store.save(next);
  }
}
