import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

type MembershipOpenedPayload = {
  aggregateId: string;
  name: string;
  email: string;
  occurredAt: Date;
};

export interface MembershipOpened extends DomainEvent<
  "MembershipOpened",
  MembershipOpenedPayload
> {}
