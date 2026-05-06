# Session 12: Formalised Pivot to BDD

## Purpose

Translate the agreed command catalogue and state machine into executable BDD scenarios (Given/When/Then). Each scenario is a specification of system behaviour that drives test-first implementation. Every command is covered with its full set of outcomes — happy path and all rejection cases.

## Participants

- **Tech Lead**
- **Domain Expert**
- **Product Owner**

## Key Discoveries

- Writing scenarios before code surfaced **two previously undiscovered edge cases**: (1) what happens when `AcceptTermsOfService` is called a second time with the same version (idempotent or error?), and (2) what happens when `ChangeEmail` is called with the same email address (no-op or error?). Both were resolved during this session.
- The **ScenarioTest helper** from the `@arts-n-crafts/ts` library maps directly to the Given/When/Then format — scenarios written here translate 1:1 to test code.
- Scenarios revealed that **`ActivateMembership` has the richest rejection surface** of any command — five distinct rejection paths. This made it the natural candidate for the first fully-implemented command.

## Scenario Convention

```
GIVEN: past events that establish the aggregate state
WHEN:  the command under test
THEN:  expected events + intents emitted, OR expected rejection
```

All scenarios use the following test fixtures:
- `membershipId`: a valid UUIDv7
- `name`: `"Alice Practitioner"`
- `email`: `"alice@example.com"`
- `newEmail`: `"alice.new@example.com"`
- `verificationToken`: a valid UUIDv7
- `tosVersion`: `"v2024.1"`
- `signedAt`: `"2024-06-01T10:00:00+00:00"`

---

## `OpenMembership`

### Scenario 1.1 — Happy path: new membership opened

```
GIVEN  no prior events (initial state)
WHEN   OpenMembership { name: "Alice Practitioner", email: "alice@example.com" }
THEN   MembershipOpened { membershipId, name, email, verificationToken }
       [Intent] SendEmailVerificationMail { to: email, verificationToken }
```

### Scenario 1.2 — Rejection: membership already exists

```
GIVEN  MembershipOpened
WHEN   OpenMembership { name: "Alice Practitioner", email: "alice@example.com" }
THEN   Rejected: MembershipAlreadyExists
```

---

## `VerifyEmail`

### Scenario 2.1 — Happy path: email verified with correct token

```
GIVEN  MembershipOpened { verificationToken: "token-abc" }
WHEN   VerifyEmail { membershipId, token: "token-abc" }
THEN   EmailVerified { verifiedAt: signedAt }
```

### Scenario 2.2 — Rejection: token does not match

```
GIVEN  MembershipOpened { verificationToken: "token-abc" }
WHEN   VerifyEmail { membershipId, token: "token-wrong" }
THEN   Rejected: TokenMismatch
```

### Scenario 2.3 — Rejection: membership is closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   VerifyEmail { membershipId, token: "token-abc" }
THEN   Rejected: MembershipClosed
```

### Scenario 2.4 — Rejection: membership not found

```
GIVEN  no prior events (initial state)
WHEN   VerifyEmail { membershipId, token: "token-abc" }
THEN   Rejected: MembershipNotFound
```

---

## `AcceptTermsOfService`

### Scenario 3.1 — Happy path: ToS accepted with known version

```
GIVEN  MembershipOpened
WHEN   AcceptTermsOfService { membershipId, version: "v2024.1", signedAt }
THEN   TermsOfServiceAccepted { version: "v2024.1", signedAt }
```

### Scenario 3.2 — Idempotent re-acceptance: same version accepted again

```
GIVEN  MembershipOpened, TermsOfServiceAccepted { version: "v2024.1" }
WHEN   AcceptTermsOfService { membershipId, version: "v2024.1", signedAt }
THEN   TermsOfServiceAccepted { version: "v2024.1", signedAt }
```

Note: re-acceptance is allowed — it updates the `signedAt` timestamp. This handles the case where a member needs to re-confirm after a ToS update.

### Scenario 3.3 — Happy path: accepting a newer ToS version

```
GIVEN  MembershipOpened, TermsOfServiceAccepted { version: "v2024.1" }
WHEN   AcceptTermsOfService { membershipId, version: "v2025.1", signedAt }
THEN   TermsOfServiceAccepted { version: "v2025.1", signedAt }
```

### Scenario 3.4 — Rejection: unknown ToS version

```
GIVEN  MembershipOpened
WHEN   AcceptTermsOfService { membershipId, version: "v9999.9", signedAt }
THEN   Rejected: UnknownTosVersion
```

### Scenario 3.5 — Rejection: membership is closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   AcceptTermsOfService { membershipId, version: "v2024.1", signedAt }
THEN   Rejected: MembershipClosed
```

---

## `ActivateMembership`

### Scenario 4.1 — Happy path: all gates met

```
GIVEN  MembershipOpened,
       EmailVerified,
       TermsOfServiceAccepted { version: "v2024.1" }
WHEN   ActivateMembership { membershipId }
THEN   MembershipActivated
       [Intent] SendWelcomeMail { to: email, name }
       [Intent] ListMemberInRegistry { membershipId, name, email }
```

### Scenario 4.2 — Rejection: email not verified

```
GIVEN  MembershipOpened,
       TermsOfServiceAccepted { version: "v2024.1" }
WHEN   ActivateMembership { membershipId }
THEN   Rejected: EmailNotVerified
```

### Scenario 4.3 — Rejection: ToS not accepted

```
GIVEN  MembershipOpened,
       EmailVerified
WHEN   ActivateMembership { membershipId }
THEN   Rejected: TermsNotAccepted
```

### Scenario 4.4 — Rejection: email verified then invalidated (not re-verified)

```
GIVEN  MembershipOpened,
       EmailVerified,
       EmailVerificationInvalidated,
       TermsOfServiceAccepted { version: "v2024.1" }
WHEN   ActivateMembership { membershipId }
THEN   Rejected: EmailNotVerified
```

### Scenario 4.5 — Rejection: membership already active

```
GIVEN  MembershipOpened, EmailVerified, TermsOfServiceAccepted, MembershipActivated
WHEN   ActivateMembership { membershipId }
THEN   Rejected: MembershipAlreadyActive
```

### Scenario 4.6 — Rejection: membership is closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   ActivateMembership { membershipId }
THEN   Rejected: MembershipClosed
```

---

## `ChangeEmail`

### Scenario 5.1 — Happy path: email changed on open membership

```
GIVEN  MembershipOpened, EmailVerified
WHEN   ChangeEmail { membershipId, newEmail: "alice.new@example.com" }
THEN   EmailChanged { newEmail: "alice.new@example.com" }
       EmailVerificationInvalidated
       [Intent] SendEmailVerificationMail { to: "alice.new@example.com", verificationToken }
```

### Scenario 5.2 — Happy path: email changed on active membership

```
GIVEN  MembershipOpened, EmailVerified, TermsOfServiceAccepted, MembershipActivated
WHEN   ChangeEmail { membershipId, newEmail: "alice.new@example.com" }
THEN   EmailChanged { newEmail: "alice.new@example.com" }
       EmailVerificationInvalidated
       [Intent] SendEmailVerificationMail { to: "alice.new@example.com", verificationToken }
```

### Scenario 5.3 — Rejection: same email address

```
GIVEN  MembershipOpened { email: "alice@example.com" }
WHEN   ChangeEmail { membershipId, newEmail: "alice@example.com" }
THEN   Rejected: EmailUnchanged
```

### Scenario 5.4 — Rejection: membership is closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   ChangeEmail { membershipId, newEmail: "alice.new@example.com" }
THEN   Rejected: MembershipClosed
```

---

## `ChangeAddress`

### Scenario 6.1 — Happy path: address set for the first time

```
GIVEN  MembershipOpened
WHEN   ChangeAddress { membershipId, address: { street: "1 Craft Lane", city: "London", postalCode: "EC1A 1BB", countryCode: "GB" } }
THEN   AddressChanged { address }
```

### Scenario 6.2 — Happy path: address updated on active membership

```
GIVEN  MembershipOpened, EmailVerified, TermsOfServiceAccepted, MembershipActivated
WHEN   ChangeAddress { membershipId, address: { street: "2 Design Street", city: "Manchester", postalCode: "M1 1AE", countryCode: "GB" } }
THEN   AddressChanged { address }
```

### Scenario 6.3 — Rejection: membership is closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   ChangeAddress { membershipId, address: { street: "1 Craft Lane", city: "London", postalCode: "EC1A 1BB", countryCode: "GB" } }
THEN   Rejected: MembershipClosed
```

---

## `CloseMembership`

### Scenario 7.1 — Happy path: open membership closed

```
GIVEN  MembershipOpened
WHEN   CloseMembership { membershipId }
THEN   MembershipClosed
       [Intent] SendClosureNotice { to: email }
       [Intent] RemoveMemberFromRegistry { membershipId, after: 30 days }
```

### Scenario 7.2 — Happy path: active membership closed

```
GIVEN  MembershipOpened, EmailVerified, TermsOfServiceAccepted, MembershipActivated
WHEN   CloseMembership { membershipId }
THEN   MembershipClosed
       [Intent] SendClosureNotice { to: email }
       [Intent] RemoveMemberFromRegistry { membershipId, after: 30 days }
```

### Scenario 7.3 — Happy path: suspended membership closed

```
GIVEN  MembershipOpened, EmailVerified, TermsOfServiceAccepted, MembershipActivated, MembershipSuspended
WHEN   CloseMembership { membershipId }
THEN   MembershipClosed
       [Intent] SendClosureNotice { to: email }
       [Intent] RemoveMemberFromRegistry { membershipId, after: 30 days }
```

### Scenario 7.4 — Rejection: membership already closed

```
GIVEN  MembershipOpened, MembershipClosed
WHEN   CloseMembership { membershipId }
THEN   Rejected: MembershipAlreadyClosed
```

### Scenario 7.5 — Rejection: membership not found

```
GIVEN  no prior events (initial state)
WHEN   CloseMembership { membershipId }
THEN   Rejected: MembershipNotFound
```

---

## Newly Discovered Edge Cases (resolved in this session)

| Case | Scenario | Resolution |
|------|---------|-----------|
| `AcceptTermsOfService` called twice with same version | 3.2 | Allowed — idempotent re-confirmation; updates `signedAt` |
| `ChangeEmail` called with identical current email | 5.3 | Rejected: `EmailUnchanged` — avoids spurious invalidation events |
| `CloseMembership` on `suspended` state | 7.3 | Allowed — suspension is not a terminal state |
| `ActivateMembership` after verify → invalidate → no re-verify | 4.4 | Rejected: `EmailNotVerified` — invalidation clears the verified state |

## Implementation Mapping

Each scenario maps directly to a test case using the `ScenarioTest` helper:

```typescript
import { ScenarioTest } from '@arts-n-crafts/ts'
import { decide } from './decide'
import { evolve } from '../../../core/evolve'

const scenario = new ScenarioTest({ decide, evolve })

it('activates a membership when all gates are met', async () => {
  await scenario
    .given(membershipOpened, emailVerified, termsOfServiceAccepted)
    .when(activateMembershipCommand)
    .then([membershipActivated])
})
```

These scenarios are the living specification of the Membership BC. When the domain model changes, the scenarios change first.
