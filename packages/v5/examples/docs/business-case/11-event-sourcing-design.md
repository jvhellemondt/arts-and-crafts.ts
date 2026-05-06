# Session 11: Event Sourcing Design Output

## Purpose

Specify the event sourcing design for the Membership bounded context in enough detail to drive implementation. Define the Decider pattern, state machine transitions, event schema strategy, intent/outbox pattern, and projection approach.

## Participants

- **Tech Lead**
- **Platform Architect**

## Key Discoveries

- The **Decider pattern** (`decide` + `evolve` as pure functions) maps perfectly to the Membership aggregate because membership state is fully determined by its event history. There is no external state that `decide` needs to inspect — all state is derived from previous events.
- **Intents are not events**. Intents are requests for side effects — things that *should happen* as a consequence of a decision. They are emitted by `decide` alongside events but routed through the `IntentOutbox`, not the `EventStore`. This keeps the event store clean and makes the aggregate behaviour fully deterministic in tests.
- **Event versioning under `v1/`** is a forward-thinking decision. The first version of every event is `v1`. If the schema changes incompatibly in future, a `v2` variant is introduced with a registered upcaster. This avoids big-bang migrations.
- **Projectors** are separate from the aggregate. They subscribe to domain events and maintain read models. The aggregate has no knowledge of projections; projections have no write authority.

## Artefacts

### Decider Pattern

```typescript
type Decide<Command, State, Event, Intent, Rejection> =
  (command: Command, state: State) => Result<{ events: Event[]; intents: Intent[] }, Rejection>

type Evolve<State, Event> =
  (state: State, event: Event) => State
```

The `decide` function:
- Takes the current command and the current aggregate state
- Checks preconditions (specifications) against the state
- Returns either `Ok({ events, intents })` or `Err(rejection)`
- Has **no I/O** — no async, no database calls, no side effects

The `evolve` function:
- Takes the current state and a single event
- Returns the next state
- Is a pure fold: `events.reduce(evolve, initialState)`
- Has **no I/O**

### Membership State Machine

```typescript
type MembershipState =
  | { status: 'initial'; id: MembershipId }
  | { status: 'open';
      id: MembershipId;
      name: Name;
      email: Email;
      address?: Address;
      emailVerifiedAt?: SignedAt;
      tosAccepted?: TosAcceptance }
  | { status: 'active';
      id: MembershipId;
      name: Name;
      email: Email;
      address?: Address }
  | { status: 'suspended';
      id: MembershipId;
      name: Name;
      email: Email;
      suspendedAt: SignedAt;
      reason: SuspensionReason }
  | { status: 'closed'; id: MembershipId }
```

### `evolve` Transitions

| Current state | Event | Next state |
|---------------|-------|-----------|
| `initial` | `MembershipOpened` | `open` (name, email set) |
| `open` | `EmailVerified` | `open` (`emailVerifiedAt` set) |
| `open` | `EmailVerificationInvalidated` | `open` (`emailVerifiedAt` cleared) |
| `open` | `TermsOfServiceAccepted` | `open` (`tosAccepted` set) |
| `open` | `MembershipActivated` | `active` |
| `open` | `EmailChanged` | `open` (email updated, `emailVerifiedAt` cleared) |
| `open` | `AddressChanged` | `open` (address updated) |
| `open` | `MembershipClosed` | `closed` |
| `active` | `EmailChanged` | `active` (email updated, `emailVerifiedAt` concept not in active state — triggers intent to re-verify) |
| `active` | `AddressChanged` | `active` (address updated) |
| `active` | `MembershipRenewed` | `active` (no state change — renewal is a historical marker) |
| `active` | `MembershipSuspended` | `suspended` (suspendedAt, reason set) |
| `active` | `MembershipClosed` | `closed` |
| `suspended` | `MemberReinstated` | `active` |
| `suspended` | `MembershipClosed` | `closed` |

### Event Schema Strategy

Events are defined under `core/events/v1/`. Each event is a plain TypeScript type with a discriminant `type` field:

```typescript
// core/events/v1/membershipOpened.ts
type MembershipOpened = {
  type: 'MembershipOpened'
  membershipId: MembershipId
  name: Name
  email: Email
  verificationToken: VerificationToken
  openedAt: SignedAt
}
```

**Versioning rules:**
- New optional fields: add to existing `v1` type (backward compatible)
- New required fields or removed fields: create `v2` type; register an upcaster that transforms `v1` → `v2` on read
- Upcasters live in `core/events/upcasters/`
- The event store always persists the version the event was written with; the aggregate always sees the latest version

### Intent Schema

Intents are defined under `core/intents/v1/`. They are not stored in the event store:

```typescript
// core/intents/v1/sendEmailVerificationMail.ts
type SendEmailVerificationMail = {
  type: 'SendEmailVerificationMail'
  to: Email
  verificationToken: VerificationToken
}
```

The `IntentOutbox` accepts intents atomically alongside events. The `OutboxWorker` polls the outbox and dispatches intents to registered relay functions. Relays are outbound adapters — they translate intents into calls to external services.

### Command Handler Flow

```
1. Receive command (from HTTP adapter or command bus)
2. Load aggregate state: fold events from EventStore over evolve
3. Call decide(command, state)
4. On Ok:
   a. Append events to EventStore (atomic write)
   b. Append intents to IntentOutbox (same transaction)
5. On Err:
   a. Return rejection to caller
6. OutboxWorker (async): poll IntentOutbox → dispatch to relays
```

### Projection Strategy

Each query use case has a dedicated projector:

| Projector | Subscribes to | Maintains |
|-----------|--------------|-----------|
| `GetMembershipProjector` | All Membership events | `MemberDetail` (single-member view) |
| `ListMembershipsProjector` | `MembershipOpened`, `MembershipActivated`, `MembershipClosed`, `MembershipSuspended` | `MemberList` (paginated admin view) |
| `PendingActivationsProjector` | `MembershipOpened`, `EmailVerified`, `TermsOfServiceAccepted`, `MembershipActivated` | `PendingActivations` (funnel view) |

Projections are rebuilt by replaying the event store from position 0. In production, projectors maintain a checkpoint and process only new events.

### Testing Strategy

The Decider functions (`decide` + `evolve`) are tested as pure functions with no infrastructure:

```typescript
// Given
const state = evolve(initialState, membershipOpened)
// When
const result = decide(activateMembershipCommand, state)
// Then
expect(result).toEqual(Ok({ events: [membershipActivated], intents: [sendWelcomeMail] }))
```

The `ScenarioTest` helper from the library wraps this pattern:

```typescript
await scenario
  .given(membershipOpened, emailVerified, termsOfServiceAccepted)
  .when(activateMembershipCommand)
  .then([membershipActivated])
```

## Contested Areas & Alternatives Considered

| Area | Alternative A | Alternative B | Decision |
|------|--------------|--------------|---------|
| Intents stored in event store | Store as first-class events | Route via separate outbox | **Separate outbox** — intents are requests, not facts; storing them in the event store conflates intent with outcome |
| State machine location | State machine in aggregate class | State machine as a plain TypeScript type + functions | **Plain type + functions** — the Decider pattern requires pure functions; classes with methods add accidental complexity |
| Verification token in state | Store token in aggregate state | Derive token from a deterministic function of event data | **Store in state** — token must be validated against what was issued; derivation would require the exact same inputs to be reproducible |
| `evolve` on projection events | Projections use the same `evolve` | Projections have their own fold logic | **Own fold logic** — projections are optimised for reads and may aggregate across many events; conflating them with the write-side evolve creates coupling |

## What This Led To

With the event sourcing design formalised, the team pivoted to writing executable BDD scenarios that would drive implementation. See `12-bdd-pivot.md`.
