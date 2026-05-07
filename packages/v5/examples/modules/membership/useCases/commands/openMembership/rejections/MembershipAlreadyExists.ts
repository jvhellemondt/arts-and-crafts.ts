import type { Rejection } from "@core/shapes/Rejection.ts";

export interface MembershipAlreadyExists extends Rejection<"MEMBERSHIP_ALREADY_EXISTS"> {
  reason: "Membership already exists";
}
