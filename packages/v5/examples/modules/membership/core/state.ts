import type { Address } from "./domain/Address.ts";
import type { Email } from "./domain/Email.ts";
import type { AggregateId } from "./domain/AggregateId.ts";
import type { Name } from "./domain/Name.ts";
import type { SignedAt } from "./domain/SignedAt.ts";
import type { TosAcceptance } from "./domain/TosAcceptance.ts";

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
