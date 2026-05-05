import type { Address } from "./domain/Address.ts";
import type { Email } from "./domain/Email.ts";
import type { MembershipId } from "./domain/MembershipId.ts";
import type { Name } from "./domain/Name.ts";
import type { SignedAt } from "./domain/SignedAt.ts";
import type { TosAcceptance } from "./domain/TosAcceptance.ts";

export type MembershipState =
  | { status: "initial"; id: MembershipId }
  | {
      status: "open";
      id: MembershipId;
      name: Name;
      email: Email;
      address?: Address;
      emailVerifiedAt?: SignedAt;
      tosAccepted?: TosAcceptance;
    }
  | { status: "active"; id: MembershipId; name: Name; email: Email; address?: Address }
  | { status: "closed"; id: MembershipId };
