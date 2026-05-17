import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import type { ListMembershipsQuery } from "./query.ts";

export class ListMembershipsHandler implements HandleQuery<
  ListMembershipsQuery,
  Promise<MembershipSummary[] | GatewayFailure>
> {
  constructor(private readonly store: LoadProjection<ListMembershipsProjection>) {}

  async handle(query: ListMembershipsQuery): Promise<MembershipSummary[] | GatewayFailure> {
    const projection = await this.store.load();
    if (isFailure(projection)) return projection;
    return Object.values(projection).filter((m) => m.status === query.payload.status);
  }
}
