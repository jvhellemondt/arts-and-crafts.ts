import type { Rejection } from "@core/shapes/Rejection.ts";
import type { Notification } from "@adapters/outbound/shapes/Notification.ts";
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
