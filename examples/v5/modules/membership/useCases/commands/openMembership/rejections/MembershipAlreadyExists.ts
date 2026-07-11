import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { OpenMembershipCommandPayload } from "../command.ts";

export interface MembershipAlreadyExists extends Rejection<"MEMBERSHIP_ALREADY_EXISTS"> {
  reason: "Membership already exists";
}

export type OpenMembershipRejected = Notification<
  "OpenMembershipRejected",
  OpenMembershipCommandPayload,
  "MEMBERSHIP_ALREADY_EXISTS",
  MembershipAlreadyExists
>;
