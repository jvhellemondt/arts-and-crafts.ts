import type {
  AdvanceCheckpoint,
  LoadCheckpoint,
  LoadEventsFrom,
  LoadProjection,
  SaveProjection,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { apply, type ListMembershipsProjection } from "./projection.ts";

type ProjectionStore = LoadProjection<ListMembershipsProjection> &
  SaveProjection<ListMembershipsProjection> &
  LoadCheckpoint &
  AdvanceCheckpoint;

export class ListMembershipsProjector {
  constructor(
    private readonly store: ProjectionStore,
    private readonly events: LoadEventsFrom<MembershipEventV1>,
    private readonly batchSize: number = 100,
  ) {}

  async tick(): Promise<void> {
    const checkpoint = await this.store.loadCheckpoint();
    if (isFailure(checkpoint)) return;

    const batch = await this.events.loadFrom(checkpoint + 1, this.batchSize);
    if (isFailure(batch)) return;

    for (const stored of batch) {
      const current = await this.store.load();
      if (isFailure(current)) return;

      const next = apply(current, stored.event);
      const saved = await this.store.save(next);
      if (isFailure(saved)) return;

      const advanced = await this.store.advanceCheckpoint(stored.globalPosition);
      if (isFailure(advanced)) return;
    }
  }
}
