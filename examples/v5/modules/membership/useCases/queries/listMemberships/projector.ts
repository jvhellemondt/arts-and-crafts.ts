import type {
  AdvanceCheckpoint,
  LoadCheckpoint,
  LoadEventsFrom,
  LoadProjection,
  SaveProjection,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure, StoredEvent } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { ResultAsync, okAsync } from "neverthrow";
import { apply, type ListMembershipsProjection } from "./projection.ts";

type ProjectionStore = LoadProjection<
  ListMembershipsProjection,
  ResultAsync<ListMembershipsProjection, GatewayFailure>
> &
  SaveProjection<ListMembershipsProjection, ResultAsync<void, GatewayFailure>> &
  LoadCheckpoint<ResultAsync<number, GatewayFailure>> &
  AdvanceCheckpoint<ResultAsync<void, GatewayFailure>>;

export class ListMembershipsProjector {
  constructor(
    private readonly store: ProjectionStore,
    private readonly events: LoadEventsFrom<
      MembershipEventV1,
      ResultAsync<StoredEvent<MembershipEventV1>[], GatewayFailure>
    >,
    private readonly batchSize: number = 100,
  ) {}

  async tick(): Promise<void> {
    await this.store
      .loadCheckpoint()
      .andThen((checkpoint) => this.events.loadFrom(checkpoint + 1, this.batchSize))
      .andThen((batch) =>
        batch.reduce<ResultAsync<void, GatewayFailure>>(
          (acc, stored) =>
            acc.andThen(() =>
              this.store
                .load()
                .map((current) => apply(current, stored.event))
                .andThen((next) => this.store.save(next))
                .andThen(() => this.store.advanceCheckpoint(stored.globalPosition)),
            ),
          okAsync(undefined),
        ),
      );
  }
}
