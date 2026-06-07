import type { Tag } from "@core/shapes/Tag.ts";
import type { Address } from "./domain/Address.ts";
import type { Email } from "./domain/Email.ts";
import type { AggregateId } from "./domain/AggregateId.ts";
import type { Name } from "./domain/Name.ts";
import type { SignedAt } from "./domain/SignedAt.ts";
import type { TosAcceptance } from "./domain/TosAcceptance.ts";

/** Tag key that scopes the dynamic consistency boundary of one membership. */
export const MEMBERSHIP_TAG_KEY = "membership";

/** The boundary tag for the membership identified by `id`. */
export const membershipTag = (id: string): Tag => ({ key: MEMBERSHIP_TAG_KEY, value: id });

export type MembershipState =
  | { status: "initial"; id: AggregateId["input"] }
  | {
      status: "open";
      id: AggregateId["input"];
      name: Name["input"];
      email: Email["input"];
      address?: Address["input"];
      emailVerifiedAt?: SignedAt["input"];
      tosAccepted?: TosAcceptance["input"];
    }
  | {
      status: "active";
      id: AggregateId["input"];
      name: Name["input"];
      email: Email["input"];
      address?: Address["input"];
    }
  | { status: "closed"; id: AggregateId["input"] };
