/*
#[derive(Debug, Error, PartialEq, Eq)]
pub enum DecideError {
    #[error("interval is invalid: started_at must be less than ended_at")]
    InvalidInterval,
}

pub enum Decision {
    Accepted {
        events: Vec<TimeEntryEvent>,
        intents: Vec<TimeEntryIntent>,
    },
    Rejected {
        reason: DecideError,
    },
}
*/

import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { Decision } from "@useCases/command/shapes/Decision.ts";
import type { MembershipAlreadyExists } from "./rejections/MembershipAlreadyExists.ts";

export type OpenMembershipDecision = Decision<
  MembershipOpenedV1,
  NotifyUserToVerifyEmailV1,
  MembershipAlreadyExists
>;
