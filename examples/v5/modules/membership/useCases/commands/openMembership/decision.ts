import type { MembershipOpenedV1 } from "../../../core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "../../../core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { Decision } from "@arts-and-crafts/v5/useCases/command/shapes";
import type { MembershipAlreadyExists } from "./rejections/MembershipAlreadyExists.ts";

export type OpenMembershipDecision = Decision<
  MembershipOpenedV1,
  NotifyUserToVerifyEmailV1,
  MembershipAlreadyExists
>;
