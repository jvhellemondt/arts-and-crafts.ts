# Session 8: Value Stream Mapping

## Purpose

Map the end-to-end value stream from a prospective member's first contact with the IDC to their status as an active, contributing member. Identify value-adding steps, wait time, and waste so that the software design can eliminate or automate the right things.

## Participants

- **Domain Expert**
- **Product Owner**
- **UX Designer**
- **Tech Lead**

## Key Discoveries

- The pre-platform process was almost entirely manual: a spreadsheet tracking registrations, an admin sending verification emails by hand, and a committee member approving activations. The current digital platform has eliminated some of this, but several manual steps remain.
- **The biggest source of abandonment** is the gap between registration and activation — prospective members who receive a verification email but never complete the process. No automated follow-up exists.
- The **ToS acceptance step is misplaced** in the current funnel. It appears after email verification, which means a member has already invested time before seeing the terms. Showing the ToS at registration would reduce surprises.
- **Annual renewal generates significant manual work** in the current process — invoices are raised by hand, payments are chased manually, and reconciliation is done in a spreadsheet. Full automation here has the highest ROI.

## Artefacts

### Value Stream: Prospective Member → Active Contributing Member

| Step | Actor | Value-adding? | Avg. wait (current) | Avg. wait (target) | Waste type |
|------|-------|:---:|---:|---:|------------|
| 1. Discovery | Prospective member | Yes | — | — | — |
| 2. Registration form | Prospective member | Yes | 5 min | 3 min | W1: no progress indicator |
| 3. Email verification | Prospective member | Yes | 2–48h | <1h | W2: manual resend, no chaser |
| 4. ToS acceptance | Prospective member | Yes | 0–72h | <1h | W3: step placement causes abandonment |
| 5. Admin review (current) | Admin | No | 1–5 days | 0 | W4: manual approval gate — eliminate |
| 6. Activation | System | Yes | 0 (automatic) | 0 | — |
| 7. Welcome email | System | Yes | 0–24h | <1 min | W5: manual send in current process |
| 8. Registry listing | System | Yes | 1–3 days | <1 min | W6: manual data entry in current process |
| **Total (happy path)** | | | **3–7 days** | **<2h** | |

### Value Stream: Active Member → Renewed Member (Annual)

| Step | Actor | Value-adding? | Avg. wait (current) | Avg. wait (target) | Waste type |
|------|-------|:---:|---:|---:|------------|
| 1. Renewal reminder | System | Yes | Manual (1–3 days late) | 30 days before expiry | W7: late notices cause lapse |
| 2. Invoice raised | Admin | No | 1–5 days | 0 | W8: manual invoice creation |
| 3. Payment | Member | Yes | 0–14 days | 0–14 days | — |
| 4. Payment reconciliation | Admin | No | 1–3 days | 0 | W9: manual reconciliation |
| 5. Renewal confirmed | System | Yes | 1–2 days after reconciliation | <1 min | W10: manual update |

### Waste Catalogue

| ID | Waste | Type | Impact | Automated by |
|----|-------|------|--------|-------------|
| W1 | No progress indicator for incomplete registrations | Waiting | High abandonment | Read model `PendingActivations` |
| W2 | Manual email resend for unverified members | Manual processing | Admin overhead | Automated chaser policy (48h) |
| W3 | ToS presented after verification — late surprise | Defect (process) | Abandonment after investment | Reorder funnel — ToS at registration |
| W4 | Manual admin approval before activation | Over-processing | 1–5 days delay | Remove gate — system activates on criteria |
| W5 | Manual welcome email send | Manual processing | Inconsistent timing | Intent/outbox on `MembershipActivated` |
| W6 | Manual registry data entry | Manual processing | 1–3 days delay | Intent/outbox on `MembershipActivated` |
| W7 | Late renewal reminders | Waiting | Preventable lapse | Time-based policy 30 days before expiry |
| W8 | Manual invoice creation | Manual processing | Admin overhead | Automatic invoice on subscription period end |
| W9 | Manual payment reconciliation | Manual processing | Admin overhead | Webhook-driven `PaymentReceived` event |
| W10 | Manual renewal confirmation | Manual processing | 1–2 days delay | Policy: `PaymentReceived` → `MembershipRenewed` |

## Contested Areas & Alternatives Considered

| Area | Alternative A | Alternative B | Decision |
|------|--------------|--------------|---------|
| ToS placement | Keep after email verification | Move to registration form | **Move to registration** — reduces abandonment; does not require code restructuring in Membership BC |
| Admin approval gate | Keep as a manual quality control step | Remove entirely | **Remove** — the three-gate specification (email + ToS + payment) provides sufficient quality control automatically |
| Abandonment chaser | Build a dedicated re-engagement campaign | Simple time-based policy to re-send verification | **Simple policy** — the campaign feature belongs in Communications; re-sending verification is a Membership concern |

## What This Led To

The waste catalogue translated directly into the opportunity map, identifying which improvements could be delivered as event-driven automations within the current architecture. See `09-opportunity-mapping.md`.
