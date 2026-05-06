# Session 6: Bounded Context Candidates

## Purpose

Formally define the nine bounded contexts that emerged from the event storm and process modelling sessions. Assign responsibility, core aggregates, commands, and events to each. Confirm boundaries are clean — no shared aggregates, no cross-context state dependencies.

## Participants

- **Tech Lead**
- **Domain Expert**
- **Platform Architect**

## Key Discoveries

- The nine contexts split cleanly into **core**, **supporting**, and **generic** subdomains. The core contexts (Membership, Accreditation, CPD) contain the IDC's competitive advantage and warrant the most investment. Generic contexts (Notifications) should be kept thin and replaceable.
- **Notifications is deliberately thin** — it knows nothing about business rules. It receives intents (what to send, to whom) and delivers them. All business decisions about *when* to send stay in the originating context.
- **Public Registry is read-only** — it has no commands of its own. It is a projection maintained by consuming events from Membership and Accreditation. This makes it simple, fast, and independently deployable.
- The **Payments BC boundary** was the most contested — see below.

## Bounded Context Definitions

### 1. Membership (Core)

**Responsibility:** The authoritative record of a member's identity and lifecycle within the IDC.

**Ubiquitous language:** Member, Membership, Email, Name, Address, TOS Acceptance, Verification Token

**Core aggregate:** `Membership`

**Commands:** `OpenMembership`, `VerifyEmail`, `AcceptTermsOfService`, `ActivateMembership`, `ChangeEmail`, `ChangeAddress`, `SuspendMembership`, `ReinstateMembership`, `CloseMembership`

**Domain events:** `MembershipOpened`, `EmailVerified`, `EmailVerificationInvalidated`, `TermsOfServiceAccepted`, `MembershipActivated`, `EmailChanged`, `AddressChanged`, `MembershipSuspended`, `MemberReinstated`, `MembershipClosed`, `MembershipRenewed`

**Intents emitted:** `SendEmailVerificationMail`, `SendWelcomeMail`

**Upstream:** None (Membership is the root of the member identity graph)

**Downstream:** Accreditation, CPD, Events, Payments, Conduct, Public Registry, Notifications

---

### 2. Accreditation (Core)

**Responsibility:** Managing professional certifications — assessing competency and awarding, maintaining, and revoking credentials.

**Ubiquitous language:** Certification, Assessment, Competency Level, Assessor, Appeal

**Core aggregates:** `Certification`, `Assessment`

**Commands:** `RequestAssessment`, `ScheduleAssessment`, `RecordAssessmentResult`, `AwardCertification`, `RevokeCertification`, `RaiseAppeal`, `DecideAppeal`

**Domain events:** `AssessmentRequested`, `AssessmentScheduled`, `AssessmentCompleted`, `CertificationAwarded`, `CertificationExpired`, `CertificationRevoked`, `AppealRaised`, `AppealDecided`

**Upstream:** Membership (requires active membership before an assessment can be requested)

**Downstream:** Public Registry, Notifications

---

### 3. CPD — Continuing Professional Development (Core)

**Responsibility:** Tracking learning activities, enforcing annual CPD requirements, and closing CPD periods.

**Ubiquitous language:** CPD Activity, CPD Record, CPD Period, CPD Points, Requirement

**Core aggregate:** `CPDRecord` (one per member per period)

**Commands:** `SubmitCPDActivity`, `ApproveCPDActivity`, `RejectCPDActivity`, `CloseCPDPeriod`

**Domain events:** `CPDActivitySubmitted`, `CPDActivityApproved`, `CPDActivityRejected`, `CPDRequirementFulfilled`, `CPDPeriodClosed`, `CPDRequirementFailed`

**Upstream:** Membership (CPD tracking begins on activation)

**Downstream:** Notifications (CPD reminders), Accreditation (CPD fulfilment may be a certification prerequisite)

---

### 4. Events (Supporting)

**Responsibility:** Scheduling and managing IDC events — conferences, workshops, and webinars — including registration and attendance tracking.

**Ubiquitous language:** Event, Registration, Attendance, Capacity, Schedule

**Core aggregates:** `Event`, `Registration`

**Commands:** `ProposeEvent`, `ScheduleEvent`, `PublishEvent`, `OpenRegistration`, `RegisterForEvent`, `ConfirmAttendance`, `CancelEvent`

**Domain events:** `EventProposed`, `EventScheduled`, `EventPublished`, `RegistrationOpened`, `MemberRegisteredForEvent`, `AttendanceConfirmed`, `EventCancelled`, `EventCompleted`

**Upstream:** Membership (only active members can register)

**Downstream:** CPD (event attendance may qualify as a CPD activity), Notifications, Communications

---

### 5. Payments (Supporting)

**Responsibility:** Raising invoices for membership fees, processing payments via the payment gateway, and triggering renewal or suspension policies.

**Ubiquitous language:** Invoice, Subscription, Payment, Fee, Grace Period, Retry

**Core aggregates:** `Invoice`, `Subscription`

**Commands:** `RaiseInvoice`, `RecordPaymentReceived`, `RecordPaymentFailed`, `IssueRefund`, `WaiveFee`

**Domain events:** `InvoiceRaised`, `PaymentReceived`, `PaymentFailed`, `PaymentRetried`, `RefundIssued`, `MembershipFeeWaived`, `SubscriptionRenewed`

**Upstream:** Membership (activation gate; renewal trigger)

**Downstream:** Membership (via integration events for suspension/renewal), Notifications

---

### 6. Communications (Supporting)

**Responsibility:** Authoring and scheduling outbound communications to members — newsletters, announcements, and targeted campaigns.

**Ubiquitous language:** Announcement, Newsletter, Campaign, Audience, Schedule

**Core aggregates:** `Announcement`, `Newsletter`

**Commands:** `DraftAnnouncement`, `PublishAnnouncement`, `ScheduleNewsletter`, `SendNewsletter`, `LaunchCampaign`

**Domain events:** `AnnouncementDrafted`, `AnnouncementPublished`, `NewsletterScheduled`, `NewsletterSent`, `CampaignLaunched`

**Upstream:** None

**Downstream:** Notifications (delivers the communications)

---

### 7. Notifications (Generic)

**Responsibility:** Receiving delivery intents from other contexts and dispatching them via the appropriate channel (email, SMS, push). Tracking delivery status and handling failures.

**Ubiquitous language:** Notification, Intent, Channel, Delivery Attempt, Bounce, Unsubscribe

**Core aggregate:** `Notification`

**Commands:** `QueueNotification`, `MarkDelivered`, `MarkFailed`, `RecordBounce`, `RecordUnsubscribe`

**Domain events:** `NotificationQueued`, `NotificationDelivered`, `NotificationFailed`, `NotificationBounced`, `MemberUnsubscribed`

**Upstream:** All other contexts (receives intents via outbox relays)

**Downstream:** External email/SMS services

**Note:** Notifications contains no business rules. If the IDC were to switch email providers, only this context changes.

---

### 8. Conduct & Governance (Supporting)

**Responsibility:** Managing the code-of-conduct enforcement process — receiving complaints, investigating, scheduling hearings, issuing sanctions, and processing appeals.

**Ubiquitous language:** Complaint, Investigation, Hearing, Sanction, Appeal, Respondent, Panel

**Core aggregates:** `Complaint`, `Hearing`

**Commands:** `RaiseComplaint`, `AssignInvestigator`, `SubmitInvestigation`, `ScheduleHearing`, `IssueDecision`, `SubmitAppeal`, `DecideAppeal`

**Domain events:** `ComplaintRaised`, `ComplaintInvestigated`, `HearingScheduled`, `SanctionIssued`, `AppealSubmitted`, `AppealDecided`

**Upstream:** Membership (sanctions are applied to memberships)

**Downstream:** Membership (via integration event ACL — `SanctionIssued` → `SuspendMembership`), Notifications

---

### 9. Public Registry (Supporting)

**Responsibility:** Maintaining a publicly searchable directory of active and verified IDC members and their certifications.

**Ubiquitous language:** Member Profile, Registry Listing, Certification Badge, Visibility

**Core aggregate:** `MemberProfile` (read-only projection — no commands)

**Domain events consumed:** `MembershipActivated`, `MembershipClosed`, `EmailChanged`, `AddressChanged`, `CertificationAwarded`, `CertificationRevoked`

**Read models:** `PublicMemberProfile`, `CertificationBadge`

**Upstream:** Membership, Accreditation

**Downstream:** None

**Note:** The Public Registry is a pure read model. It has no write-side aggregate. Attempting to add commands here is a design smell — updates flow in via events from upstream contexts.

## Contested Areas & Alternatives Considered

| Area | Alternative A | Alternative B | Decision |
|------|--------------|--------------|---------|
| Payments boundary | Thin ACL wrapper over Stripe | Full BC with own aggregates | **Full BC** — decouples IDC domain from Stripe model |
| Public Registry | Part of Membership read models | Separate BC | **Separate BC** — distinct access control, caching strategy, and public API |
| Terms of Service | Part of Membership | Separate Terms BC | **Deferred** — stubbed in v1; Terms BC to be defined in a future session |
| Notifications | Part of Communications | Separate generic BC | **Separate BC** — different replacement likelihood, different team ownership |

## What This Led To

With context boundaries confirmed, the team moved to defining the detailed aggregate/command/policy structures for each context, starting with Membership. See `07-aggregate-command-policy.md`.
