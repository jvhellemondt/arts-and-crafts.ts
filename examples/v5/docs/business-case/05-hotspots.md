# Session 5: Hotspots

## Purpose

Identify pain points, open questions, contested areas, and unknowns that surfaced across the Big Picture, Process Modelling, and Software Design sessions. Hotspots are marked with red stickies — they do not block progress but must be resolved before implementation of the affected flows.

## Participants

- **Domain Expert**
- **Tech Lead**
- **Product Owner**
- **Legal/Compliance Advisor** (joined for regulatory questions)

## Key Discoveries

Several hotspots required immediate resolution because they affected aggregate state design. Others were deferred to later sessions or designated as out-of-scope for v1. Each hotspot below records the options considered and the resolution reached.

## Hotspots

### H1: When does EmailVerificationInvalidated fire?

**Question:** Does `ChangeEmail` immediately emit `EmailVerificationInvalidated`, or only after a grace period if the new email has not been verified?

**Options:**
- A. Immediate — on `ChangeEmail`, emit both `EmailChanged` and `EmailVerificationInvalidated` in the same decide step
- B. Deferred — emit only `EmailChanged`; a separate policy fires `EmailVerificationInvalidated` after a configurable timeout if not yet verified

**Resolution:** **Option A — immediate**. An active member with an unverified email is a security liability. The inconvenience of requiring re-verification is acceptable. The `evolve` function clears `emailVerifiedAt` on `EmailVerificationInvalidated`.

---

### H2: Is a physical address required to activate?

**Question:** The `MembershipState` for `open` marks `address` as optional. Can a member activate without providing an address?

**Options:**
- A. Optional at activation — address can be added later via `ChangeAddress`
- B. Required at activation — the `ActivateMembership` specification must check address is present
- C. Required at activation for certain tiers only (deferred to when tiers are introduced)

**Resolution:** **Option A — optional at activation**. The IDC's primary identifier is email, not postal address. Address is required for certain downstream processes (physical certificate despatch, regulatory filing) but not for the basic membership lifecycle. Captured as a domain note on the `MembershipState` type.

---

### H3: Who owns TOS version validity?

**Question:** The `tosVersionMustBeKnown` specification must check whether a given TOS version is valid. Where does the list of known versions live?

**Options:**
- A. Hardcoded in the specification — simple but requires a deployment to add a new TOS version
- B. Configuration service — fetched at runtime from a config store
- C. Separate Terms bounded context — a `TermsOfService` aggregate owns the list of published versions

**Resolution:** **Option C — separate Terms BC** is the correct long-term answer. For v1, the specification is implemented as a **stub** that accepts any non-empty version string, with a TODO marking the injection point for the Terms BC when it is built. The stub is explicitly documented so future implementors know it is not the final design.

---

### H4: Payment failure — grace period and retry strategy

**Question:** How many payment retries before suspension? How long is the grace period? Is this configurable?

**Options:**
- A. Immediate suspension on first failure
- B. 3 retries over 14 days, then suspension; 30 days suspended before closure
- C. Configurable retry and grace period driven by a policy configuration aggregate

**Resolution:** **Option B — 3 retries / 14 days / 30 days**. Option C is over-engineered for v1. The policy is implemented as a fixed strategy in the Payments BC. The numbers (3, 14, 30) are captured as named constants, making them easy to change.

---

### H5: Suspension as a Membership state or a Conduct concept?

**Question:** Should `suspended` be a state in the Membership aggregate's state machine, or a separate concept owned by the Conduct BC?

**Options:**
- A. `suspended` in Membership — Membership has a four-state machine: `initial → open → active → suspended → closed`
- B. Conduct BC owns suspension — Conduct writes a `SuspendedFlag` that overlays Membership status
- C. `suspended` in Membership, reachable only via commands issued by other BCs

**Resolution:** **Option C**. The Membership aggregate owns its state machine including `suspended`. However, `SuspendMembership` is a command that can only be issued by the Conduct BC (via an integration event ACL) or by the Payments BC (via the renewal lapse policy). Direct calls from the member portal or admin portal are rejected. This keeps aggregate ownership clean while preserving autonomy.

---

### H6: Public Registry visibility after closure

**Question:** Should a closed member's profile remain visible as "Former Member", become hidden, or be deleted?

**Options:**
- A. Immediate removal on `MembershipClosed`
- B. Hidden after a 30-day grace period; data retained internally
- C. Permanent "Former Member" badge — always visible

**Resolution:** **Option B — hidden after 30 days**. The 30-day window lets the member notify contacts of their change of status. Internal data is retained for 7 years per regulatory requirement (see H7). The grace period is configurable.

---

### H7: CPD records and certification data on membership closure

**Question:** Are CPD records and certification history preserved, archived, or deleted when membership closes?

**Options:**
- A. Deleted — GDPR minimisation argument
- B. Archived — moved to cold storage, not accessible via the portal
- C. Preserved — retained in the event store; accessible to admins and to the member on request

**Resolution:** **Option C — preserved for 7 years**, per the legal/compliance advisor's input: professional bodies in several jurisdictions are required to retain membership and certification records for a minimum of 7 years for regulatory and dispute-resolution purposes. GDPR right-to-erasure requests are handled via a pseudonymisation strategy, not deletion of event records.

---

### H8: Certification validity after membership closure

**Question:** Can a certification remain valid after a membership closes?

**Options:**
- A. Certifications are valid independently of membership — closing membership does not affect them
- B. Certifications are voided on membership closure; registry shows "inactive"
- C. Certifications expire naturally (they have their own expiry date); closure does not accelerate expiry

**Resolution:** **Option B — voided on closure**. IDC certification explicitly implies current active membership. The `CertificationRevoked` event is emitted as a consequence of `MembershipClosed` via a policy in the Accreditation BC.

---

### H9: Renewal — is it a new cycle or continuation?

**Question:** Should annual renewal be modelled as close + reopen (restarting the lifecycle) or as a `MembershipRenewed` event that extends the current membership?

**Options:**
- A. Close + reopen — reuses existing commands; CPD and certification records start fresh
- B. `MembershipRenewed` event — extends the current membership; history preserved; CPD period rolls over

**Resolution:** **Option B — MembershipRenewed**. Restarting the lifecycle would destroy the member's CPD and certification history, which contradicts the domain expert's expectation that renewal is "a continuation, not a new contract".

## What This Led To

The resolved hotspots fed directly into the bounded context candidate definitions and the precise specification of aggregate invariants. See `06-bounded-context-candidates.md`.
