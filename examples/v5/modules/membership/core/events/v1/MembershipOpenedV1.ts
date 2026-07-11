import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";

type MembershipOpenedV1Payload = {
  membershipId: string;
  name: string;
  email: string;
};

export interface MembershipOpenedV1 extends DomainEvent<
  "MembershipOpened.v1",
  MembershipOpenedV1Payload
> {}
