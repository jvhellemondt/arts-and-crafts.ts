import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

type MembershipOpenedPayload = {
  aggregateId: string;
  name: string;
  email: string;
};

export interface MembershipOpened extends DomainEvent<
  "MembershipOpened",
  MembershipOpenedPayload
> {}
