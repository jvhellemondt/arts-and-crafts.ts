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

import type { Decision } from "@useCases/command/shapes/Decision.ts";

export type OpenMembershipDecision = Decision<any, any, any>;
