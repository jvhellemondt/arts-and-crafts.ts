import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

type MembershipOpenedV1Payload = {
  membershipId: string;
  name: string;
  email: string;
};

export interface MembershipOpenedV1 extends DomainEvent<
  "MembershipOpened.v1",
  MembershipOpenedV1Payload
> {}
