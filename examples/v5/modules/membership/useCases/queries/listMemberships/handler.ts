import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import { isFailure } from "../../../../../shared/utils/isFailure.ts";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import type { ListMembershipsQuery } from "./query.ts";

export class ListMembershipsHandler implements HandleQuery<
  ListMembershipsQuery,
  Promise<MembershipSummary[] | GatewayFailure>
> {
  private readonly store: LoadProjection<ListMembershipsProjection>;

  constructor(store: LoadProjection<ListMembershipsProjection>) {
    this.store = store;
  }

  async handle(query: ListMembershipsQuery): Promise<MembershipSummary[] | GatewayFailure> {
    const projection = await this.store.load();
    if (isFailure(projection)) return projection;
    return Object.values(projection).filter((m) =>
      query.payload.status ? m.status === query.payload.status : true,
    );
  }
}
