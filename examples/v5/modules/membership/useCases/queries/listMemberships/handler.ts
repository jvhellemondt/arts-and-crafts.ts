import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { ResultAsync } from "neverthrow";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import type { ListMembershipsQuery } from "./query.ts";

export class ListMembershipsHandler implements HandleQuery<
  ListMembershipsQuery,
  ResultAsync<MembershipSummary[], GatewayFailure[]>
> {
  constructor(
    private readonly store: LoadProjection<
      ListMembershipsProjection,
      ResultAsync<ListMembershipsProjection, GatewayFailure>
    >,
  ) {}

  handle(query: ListMembershipsQuery): ResultAsync<MembershipSummary[], GatewayFailure[]> {
    return this.store
      .load()
      .mapErr((failure): GatewayFailure[] => [failure])
      .map((projection) =>
        Object.values(projection).filter((m) => (query.status ? m.status === query.status : true)),
      );
  }
}
