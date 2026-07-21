# Example Application — Component Reference

This document describes every non-test source file in the `examples/` directory. It is aimed at developers who want to understand how the v5 library is used in practice and how to apply the same patterns in their own modules.

---

## Architecture Overview

The example application implements a **Membership** bounded context using CQRS and event sourcing. It is structured in four layers that map to distinct directories:

```
examples/
├── shared/           # Generic infrastructure shared across modules
│   ├── adapters/
│   │   ├── inbound/  # Framework-agnostic request helpers
│   │   └── outbound/ # In-memory implementations of outbound ports
│   └── utils/        # Pure utility functions
├── modules/
│   └── membership/
│       ├── core/     # Domain model: value objects, events, intents
│       ├── adapters/ # Module-level outbound adapters (relays)
│       └── useCases/ # Commands, queries, and policies
└── shell/            # Application wiring and HTTP entrypoint
```

### How the layers compose

```
HTTP Request
    │
    ▼
Inbound Adapter (hono.ts / http.ts)
  — validates input with Zod schema
  — constructs a typed Command or Query
    │
    ▼
Handler (handler.ts)
  — loads DecisionState via Repository (commands)
    or loads Projection (queries)
  — calls decide() (commands only)
  — stores events in EventStore (commands)
  — stages intents in Outbox (commands)
    │
    ▼
EventStore (append-only log)
Outbox (pending intents)
ProjectionStore (read model)
    │
    ▼
Background workers
  — IntentRelay: drains Outbox → intent handlers
  — Projector: advances read model from EventStore
```

The domain layer (core/) never imports from infrastructure. All infrastructure flows through typed capability interfaces (`LoadDomainEvents`, `AppendToEventStore`, etc.) defined by the v5 library.

---

## Shared Infrastructure

### `shared/adapters/inbound/ParsedHonoBody.ts`

**Type:** Generic utility type

**What it is.** A helper type that describes the Zod input/output contract for Hono's `sValidator` middleware. It maps a Zod kind (`"json"` or `"query"`) to the raw input type and the parsed output type.

**Responsibilities.** Gives inbound adapters a typed surface for validator-parsed request bodies so editors can autocomplete both the raw form (what the client sends) and the parsed form (what the handler receives).

**Why to use it.** `sValidator` from `@hono/standard-validator` uses a `ParsedHonoBody`-shaped generic to type `c.req.valid(kind)`. Without it the return type would be `unknown`.

**How to use it.**

```ts
// schema.ts — declare the schema shape
export const openMembershipSchema = openMembershipCommandPayload.omit({ membershipId: true });

// hono.ts — the validator infers ParsedHonoBody automatically
route.post("membership/open", sValidator("json", openMembershipSchema), async (c) => {
  const body = c.req.valid("json"); // typed as z.output<typeof openMembershipSchema>
});
```

**Architecture fit.** Lives in the inbound adapter layer. Has no runtime behaviour — it is purely a TypeScript type.

---

### `shared/adapters/outbound/EmailGateway.ts`

**Type:** Outbound port interface + in-memory implementation

**What it is.** Defines `EmailGateway` — the contract for sending email — and `InMemoryEmailGateway`, a test-friendly implementation that collects sent messages in memory and supports fault simulation.

**Responsibilities.**
- `EmailGateway.send(message: EmailMessage)` — send a single email.
- `InMemoryEmailGateway.sent` — public array of all messages that have been dispatched, useful in tests.
- `SimulateFaults` — can be put in `"offline"` mode to make `send` throw, allowing tests to verify error-handling paths.

**Why to use it.** Decouples intent handlers from a real email provider. In tests and local development the in-memory variant is used; in production it is swapped for a real SMTP or API-backed implementation that satisfies the same `EmailGateway` interface.

**How to use it.**

```ts
// wiring (main.ts)
const emailGateway = new InMemoryEmailGateway();

// usage in a policy handler
await emailGateway.send({
  to: intent.payload.email,
  subject: "Please verify your email",
  body: `Hi ${intent.payload.name}, click to verify.`,
  idempotencyKey: intent.id, // ensures at-most-once delivery at the gateway level
});
```

**Architecture fit.** Outbound adapter layer. Depended on by intent/policy handlers. The interface `EmailGateway` belongs to the application's port contracts; `InMemoryEmailGateway` is an adapter.

---

### `shared/adapters/outbound/InMemoryDatasource.ts`

**Type:** Outbound infrastructure — shared in-memory "database"

**What it is.** `InMemoryDatasource` is the physical storage `InMemoryEventStore` and `InMemoryOutbox` read from and write to — `table name -> rows`, the in-memory stand-in for a single SQL connection with multiple tables. It starts in autocommit mode, like a real connection:

- **Autocommit (default state)** — `write()` lands in the table immediately, exactly like a standalone in-memory adapter used on its own.
- **`begin()`** opens a transaction — subsequent `write()`s only stage rows; nothing is visible via `read()` until `commit()` flushes every staged write at once, or `rollback()` discards them instead. Either way, the datasource returns to autocommit afterward.

**Why to use it.** This is what makes atomic persistence possible at all: `InMemoryEventStore` and `InMemoryOutbox` never gained any special "transactional" methods of their own — they still just `append()`/`stage()`, exactly as before. What changed is that both can be pointed at the *same* `InMemoryDatasource`. `InMemoryTransactionalWriter` opens the transaction around its own coordinated write; a write made outside of that (e.g. staging a standalone rejection notification straight onto the shared outbox) still commits immediately, because the datasource isn't mid-transaction — see [ADR-0010](../../packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md).

**How to use it.**

```ts
// standalone use (default) — behaves exactly as before, no changes needed
const eventStore = new InMemoryEventStore<MembershipEventV1>();

// transactional use — shared datasource
const datasource = new InMemoryDatasource();
const eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(datasource);
const writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);

// a rejection notification staged directly (outside persist()) commits right away
await outbox.stage([rejectionNotification]);
```

**Architecture fit.** Outbound infrastructure layer, one level below `InMemoryEventStore`/`InMemoryOutbox`. Both stores are constructed against it; `InMemoryTransactionalWriter` additionally holds a direct reference to call `begin()`/`commit()`/`rollback()` around driving the two stores.

---

### `shared/adapters/outbound/EventStore.InMemory.ts`

**Type:** Outbound adapter — event store

**What it is.** `InMemoryEventStore<TEvent>` is an append-only event store backed by an `InMemoryDatasource`. It implements three capability interfaces from the v5 library:

- `LoadDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>` — load events by stream keys.
- `LoadEventsFrom<TEvent>` — load events from a global position (for projectors).
- `AppendToEventStore<TEvent, Promise<void | GatewayFailure>>` — append new events.
- `SimulateFaults` — can be set to `"offline"` mode.

**Responsibilities.** Provides a complete event store during tests and local development without requiring a real database. Assigns a sequential `globalPosition` to each stored event, which projectors use as a cursor.

**How to use it.**

```ts
const eventStore = new InMemoryEventStore<MembershipEventV1>();

// load events for a stream
const events = await eventStore.load([
  "Membership#membership-123",
  "EmailRegistration#user@example.com",
]);

// append new events
await eventStore.append(newEvents);

// simulate a database outage in tests
eventStore.simulate("offline");
const result = await eventStore.load([...]);
// result is a GatewayFailure, not an array
eventStore.restore();
```

**Architecture fit.** Outbound infrastructure layer. Consumed by `OpenMembershipRepository` (read side) and `ListMembershipsProjector` (read side); write access for `openMembership` goes through `InMemoryTransactionalWriter`. Pass the same `InMemoryDatasource` given to an `InMemoryOutbox` to have both participate in one atomic write.

---

### `shared/adapters/outbound/IntentRelay.ts`

**Type:** Outbound adapter — intent dispatcher

**What it is.** `IntentRelay<TIntent>` drains the outbox and dispatches each pending intent to its registered handler. It implements `RelayPendingIntents` from the v5 library.

**Responsibilities.**
- Loads a batch of pending intents from the outbox.
- Looks up the correct `HandleIntent` implementation by `intent.type`.
- Marks each intent as `dispatched` on success or `failed` (with the error message) on exception.
- If no handler is registered for an intent type, marks it failed immediately rather than retrying forever.

**Why to use it.** Provides at-least-once, ordered intent delivery from the transactional outbox to downstream handlers (email, notifications, etc.) without coupling the command handler to those side-effects.

**How to use it.**

```ts
const handlers = new Map<string, HandleIntent<MembershipIntents>>([
  ["NotifyUserToVerifyEmail.v1", new NotifyUserToVerifyEmailHandler(emailGateway)],
]);
const relay = new IntentRelay<MembershipIntents>(outbox, handlers);

// called on a timer in main.ts
setInterval(() => relay.relay(), 1000);
```

**Architecture fit.** Outbound adapter layer. `IntentRelay` depends on the `InMemoryOutbox` (or any outbox satisfying `LoadPendingIntents & MarkIntentDispatched & MarkIntentFailed`) and a map of intent handlers. It is wired up in `main.ts`.

---

### `shared/adapters/outbound/Outbox.InMemory.ts`

**Type:** Outbound adapter — transactional outbox

**What it is.** `InMemoryOutbox<TIntent, TNotification>` is an implementation of the outbox pattern backed by an `InMemoryDatasource`. It stores intents and notifications as `OutboxEnvelope` entries with status tracking (`pending` / `dispatched` / `failed`).

**Capabilities implemented:**
- `StageIntents<TIntent>` — accept intents from command handlers.
- `StageNotifications<TNotification>` — accept rejection notifications.
- `LoadPendingIntents<TIntent>` — used by `IntentRelay`.
- `MarkIntentDispatched` / `MarkIntentFailed` — used by `IntentRelay`.
- `SimulateFaults` — `"offline"` mode returns `GatewayFailure` on every operation.

**Why to use it.** Decouples the command handler from side-effects. A background worker then delivers the intents asynchronously, making delivery reliable even if the worker crashes.

**How to use it.**

```ts
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(datasource);

// staging directly (e.g. a standalone notification) — for events+intents
// together, go through InMemoryTransactionalWriter instead, see below
await outbox.stage(decision.intents);

// mark as dispatched after successful delivery (done by IntentRelay)
await outbox.markDispatched(intent.id);
```

**Architecture fit.** Outbound adapter layer. Read side (`loadPending`/`markDispatched`/`markFailed`) is consumed by `IntentRelay`. Two different write paths use the same outbox for two different reasons: intents that must land atomically with the events they accompany go through `InMemoryTransactionalWriter`, not `outbox.stage()` directly; a rejection notification has no atomicity partner, so `OpenMembershipHandler` stages it straight onto `outbox` via `StageNotifications`, and it commits immediately (see `InMemoryDatasource.ts`).

---

### `shared/adapters/outbound/TransactionalWriter.InMemory.ts`

**Type:** Outbound adapter — atomic event + intent writer

**What it is.** `InMemoryTransactionalWriter<TEvent, TIntent>` drives an `InMemoryEventStore` and an `InMemoryOutbox` — both constructed against the same `InMemoryDatasource` — and implements the library's `PersistEventsAndIntents<TEvent, TIntent>` capability. It exists to make ADR-0005's "same transaction" guarantee concrete: `persist()` opens a transaction on the datasource, so `append()` and `stage()` only stage their writes for its duration; it commits both together, or rolls both back if either failed. Either both the event and its intent become visible, or neither does — see [ADR-0010](../../packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md) for the full design.

**Why to use it.** Appending events and staging intents as two independent calls (even combined only for error reporting, e.g. via `ResultAsync.combineWithAllErrors`) allows one to succeed while the other fails — the event stream and the outbox drift out of sync with no way to detect it after the fact. This adapter closes that gap for the in-memory example.

**How to use it.**

```ts
const datasource = new InMemoryDatasource();
const eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(datasource);
const writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);

// inside the command handler, on the accepted branch
await writer.persist(decision); // decision.events + decision.intents
```

**Architecture fit.** Outbound adapter layer. Consumed by `OpenMembershipHandler` in place of a bare `StageIntents` outbox dependency. `IntentRelay` still reads from `outbox` directly (`loadPending`/`markDispatched`/`markFailed`) — those read only committed rows, so a relay can never see an intent that was staged but rolled back.

---

### `shared/adapters/outbound/ProjectionStore.InMemory.ts`

**Type:** Outbound adapter — projection store

**What it is.** `InMemoryProjectionStore<TState>` is a checkpoint-aware in-memory store for a single read model. It implements:

- `LoadProjection<TState>` / `SaveProjection<TState>` — read and write the current projection state.
- `LoadCheckpoint` / `AdvanceCheckpoint` — track the last processed global event position so the projector can resume after a restart without reprocessing everything.
- `SimulateFaults`.

**Why to use it.** Projectors need to be idempotent and resumable. By storing the checkpoint alongside the projection, the projector can always pick up from where it left off, even in a crash-recovery scenario.

**How to use it.**

```ts
const store = new InMemoryProjectionStore<ListMembershipsProjection>(emptyProjection);

// projector usage
const checkpoint = await store.loadCheckpoint(); // returns last processed position
const events = await eventSource.loadFrom(checkpoint + 1, batchSize);
for (const stored of events) {
  const current = await store.load();
  await store.save(apply(current, stored.event));
  await store.advanceCheckpoint(stored.globalPosition);
}
```

**Architecture fit.** Outbound adapter layer. Used by `ListMembershipsProjector`. The same instance is also injected into `ListMembershipsHandler` for querying, so both the write-path (projector) and read-path (handler) share the same in-memory state.

---

### `shared/utils/createStreamKey.ts`

**Type:** Pure utility function

**What it is.** Constructs a `StreamKey` — a typed string of the form `"Anchor#id"` — from a domain anchor name and a domain identifier.

```ts
createStreamKey("Membership", "membership-123") // → "Membership#membership-123"
createStreamKey("EmailRegistration", "user@example.com") // → "EmailRegistration#user@example.com"
```

**Why to use it.** A `StreamKey` is the concurrency boundary in the event store. Events that share a stream key form a consistency group: loading events by stream key reconstructs the decision state for that entity or constraint. Using a factory function prevents typos and makes the anchor/id structure explicit.

**Anchors vs aggregates.** An anchor names a domain concept used as a concurrency fence (e.g. `Membership`, `EmailRegistration`). It does not imply aggregate lifecycle or behaviour. A single event can reference multiple stream keys (e.g. a `MembershipOpened` event concerns both the membership id and the email address, preventing duplicate email registration).

**Architecture fit.** Called inside `decide.ts` and `repository.ts` wherever stream keys must be constructed.

---

### `shared/utils/findConcern.ts`

**Type:** Pure utility function

**What it is.** Searches a `readonly StreamKey[]` for the first key whose anchor prefix matches a given type string.

```ts
findConcern(event.concerns, "EmailRegistration")
// returns "EmailRegistration#user@example.com" or undefined
```

**Why to use it.** When processing events in a projector or relay, you often need to extract the id embedded in a specific stream key without knowing its position in the array. `findConcern` provides a type-safe, prefix-matched lookup.

**Architecture fit.** Utility layer. Used wherever event concerns must be inspected to extract domain identifiers from a `DomainEvent`.

---

### `shared/utils/isFailure.ts`

**Type:** Type guard function

**What it is.** Narrows an unknown value to `GatewayFailure` by checking `value.kind === "failure"`.

```ts
const result = await eventStore.load(keys);
if (isFailure(result)) {
  // result is GatewayFailure — infrastructure is unavailable
  return result;
}
// result is TEvent[] — safe to use
```

**Why to use it.** Outbound adapters return `T | GatewayFailure` rather than throwing exceptions. `isFailure` is the idiomatic discriminant used throughout handlers and projectors to branch on the failure case without catching exceptions.

**Architecture fit.** Used in every handler, repository, and projector that calls an outbound adapter.

---

### `shared/utils/isRejection.ts`

**Type:** Type guard function

**What it is.** Narrows a `Decision<TEvent, TIntent, TRejection>` to `Rejected<TRejection>` by checking `!value.accepted`.

```ts
const decision = decideOpenMembership(state, command);
if (isRejection(decision)) {
  return decision.rejection; // MembershipAlreadyExists
}
// decision is Accepted — safe to access decision.events
```

**Why to use it.** `Decision` is a discriminated union on `accepted`. `isRejection` keeps the branch readable and ensures TypeScript narrows the type correctly in both branches.

**Architecture fit.** Used in command handlers immediately after calling the `decide` function.

---

## Shell — Application Wiring

### `shell/main.ts`

**Type:** Application entry point

**What it is.** Creates and connects all infrastructure instances, wires them into the HTTP application, and starts background workers.

**Responsibilities.**
1. Instantiates shared infrastructure: `InMemoryEventStore`, `InMemoryOutbox`, `InMemoryTransactionalWriter` (composing the two for atomic event+intent writes), `InMemoryEmailGateway`, `InMemoryProjectionStore`.
2. Builds the intent handler map and creates an `IntentRelay`.
3. Creates `ListMembershipsProjector`.
4. Passes everything into `createHonoApp`.
5. Starts two `setInterval` loops — one for `IntentRelay.relay()` (every 1 s) and one for `ListMembershipsProjector.tick()` (every 100 ms).
6. Registers `SIGINT`/`SIGTERM` handlers that clear both timers.
7. Exports `{ port: 3000, fetch: honoApp.fetch }` for Bun's HTTP server.

**Architecture fit.** Shell layer — the single place where infrastructure is constructed and module concerns are composed. Nothing inside `modules/` or `shared/` imports from `shell/`.

---

### `shell/apps/hono/index.ts`

**Type:** HTTP application factory

**What it is.** `createHonoApp(eventStore, outbox, openMembershipWriter, listMembershipsProjectionLoader)` creates a Hono application with all middleware and routes registered. `openMembershipWriter` is the `PersistEventsAndIntents` port (backed by `InMemoryTransactionalWriter` in `main.ts`) that the `openMembership` route uses for its atomic write; `outbox` remains available separately for its `StageNotifications` capability.

**Responsibilities.**
- Applies production-grade middleware: `compress`, `cors`, `csrf`, `logger`, `requestId`, `secureHeaders`, `timeout(5000)`, `timing`, `trimTrailingSlash`.
- Constructs `OpenMembershipRepository` from the event store.
- Registers the `openMembership` command route via `createOpenMembershipInboundHonoAdapter`.
- Registers the `listMemberships` query route via `createListMembershipsInboundHonoAdapter`.
- Handles `404` and `500` with plain-text fallbacks.

**Why to use it.** Separates HTTP concerns (middleware, routing) from wiring concerns (which adapters to use). Accepts the outbound ports as typed capability intersections rather than concrete classes, so the app can be tested with any conforming implementation.

**Architecture fit.** Shell layer. Depends on inbound adapters from the module, and capability interfaces from the v5 library. Returns a standard Hono app, making it framework-agnostic at the boundary.

---

## Membership Module — Core

### `core/anchors.ts`

**Type:** Domain constants

**What it is.** Exports two string constants that name the module's stream key anchors:

```ts
export const ANCHOR_MEMBERSHIP = "Membership";
export const ANCHOR_EMAIL = "EmailRegistration";
```

**Why to use it.** Centralises anchor names to prevent silent mismatches between the `decide` function (which writes concerns) and the `repository` (which queries by concerns). Any change to an anchor name is caught at compile time everywhere it is imported.

---

### Domain Value Objects (`core/domain/`)

All value objects follow the same pattern: a Zod schema (named after the value object in camelCase) and a companion type that separates `input` (what the client sends) from `parsed` (the validated, branded form the domain uses).

```ts
// generic pattern
export const myValue = z.string().min(1).brand<"MyValue">();
export type MyValue = { parsed: z.infer<typeof myValue>; input: z.input<typeof myValue> };
```

**Branding** ensures that a raw `string` cannot be passed where an `Email` or `AggregateId` is expected. The schema is the single source of validation truth; it is reused in command payload schemas.

| File | Type | Constraint |
|------|------|-----------|
| `AggregateId.ts` | UUID v7 branded string | `z.uuid({ version: "v7" })` |
| `Email.ts` | RFC email branded string | `z.email()` |
| `Name.ts` | Non-empty branded string | `z.string()` |
| `Address.ts` | Branded object | Street, city, postal code, ISO country code (validated against `countries-list`) |
| `MembershipStatus.ts` | Branded enum | `"initial" \| "open" \| "active" \| "closed"` |
| `TosVersion.ts` | Non-empty branded string | `z.string().min(1)` |
| `SignedAt.ts` | ISO-8601 datetime with offset | `z.iso.datetime({ offset: true })` |
| `TosAcceptance.ts` | Branded composite | `{ version: TosVersion, signedAt: SignedAt }` |
| `VerificationToken.ts` | UUID v7 (unbranded) | `z.uuid({ version: "v7" })` |

**Architecture fit.** Core domain layer. Imported by event payloads, command payload schemas, and query payload schemas. Never import from `adapters/` or `useCases/`.

---

### `core/events/` — Domain Events

**Type:** `DomainEvent` interface extensions

**What it is.** Each event file declares an interface that extends `DomainEvent<TType, TPayload>` from the v5 library. The `kind` discriminant is `"domain"`. The `concerns` field (type `readonly StreamKey[]`) lists the stream keys that this event belongs to.

Currently implemented:

```ts
// MembershipOpenedV1.ts
export interface MembershipOpenedV1 extends DomainEvent<
  "MembershipOpened.v1",
  { membershipId: string; name: string; email: string }
> {}
```

The remaining event files (`AddressChangedV1`, `EmailChangedV1`, `EmailVerificationInvalidatedV1`, `EmailVerifiedV1`, `MembershipActivatedV1`, `MembershipClosedV1`, `TermsOfServiceAcceptedV1`) are scaffolded as empty stubs — placeholders for future use cases.

**`core/events/index.ts`** exports the union type `MembershipEventV1 = MembershipOpenedV1`, the single event type that the event store and projectors are parameterised on. Add new events to this union as use cases are implemented.

**Naming convention.** Event types use dot-notation versioning: `"MembershipOpened.v1"`. The `v1` suffix enables schema evolution — a future breaking change becomes `v2` and can be handled alongside `v1` in the same `switch`.

**Architecture fit.** Core domain layer. Events are produced by `decide.ts` files and consumed by `evolve.ts` and `projection.ts` files.

---

### `core/intents/` — Intents

**Type:** `Intent` interface extensions

**What it is.** An `Intent` is a command-like message that a domain decision stages for side-effects to be delivered outside the domain boundary. It extends `Intent<TType, TPayload>` from the v5 library and carries `kind: "intent"`, `commandId`, and `commandType` provenance fields.

```ts
// NotifyUserToVerifyEmail.ts
export interface NotifyUserToVerifyEmailV1 extends Intent<
  "NotifyUserToVerifyEmail.v1",
  { email: string; name: string }
> {}
```

**`core/intents/index.ts`** exports `MembershipIntents = NotifyUserToVerifyEmailV1`, the union of all intents the module can produce. `WelcomeNewUser.ts` is a stub.

**Why intents, not events?** Events record what happened (past tense, immutable). Intents express what the domain wants to happen next (imperative, delivered at-least-once via the outbox). Intents are not appended to the event store; they are staged in the outbox and dispatched by a relay worker.

**Architecture fit.** Core domain layer. Produced by `decide.ts` files, staged by handlers, consumed by policy handlers via `IntentRelay`.

---

## Membership Module — Outbound Relays

### `adapters/outbound/relays/events/membershipEventRelay.ts`
### `adapters/outbound/relays/intents/sendEmailVerificationMailRelay.ts`
### `adapters/outbound/relays/intents/sendWelcomeMailRelay.ts`

**Status.** These files are empty stubs. They mark the intended location for module-level event relay adapters (e.g. publishing `MembershipOpened` as an integration event to a message broker) and intent relay adapters (sending welcome and verification emails). The `NotifyUserToVerifyEmail` policy handler (see below) is the only currently implemented intent handler.

---

## Use Case: `openMembership` — Reference Pattern

This is the most fully elaborated use case in the codebase. Read it as the canonical example of how to implement a command use case.

### `command.ts`

**Type:** Command factory + payload schema

**What it is.** Defines:
- `OPEN_MEMBERSHIP = "OpenMembership"` — the command type constant.
- `openMembershipCommandPayload` — a Zod object schema validating `{ membershipId, name, email }`.
- `createOpenMembershipCommand(payload, metadata)` — factory that produces a fully formed `Command<"OpenMembership", OpenMembershipCommandPayload>` with a new UUID v7 id and current timestamp.
- `OpenMembershipCommand` — the inferred return type.

**Why to use it.** Putting the payload schema here (rather than in the inbound adapter) means it is reusable across any transport. The adapter strips `membershipId` from the HTTP request body (it is server-generated) via `openMembershipCommandPayload.omit({ membershipId: true })`.

```ts
const command = createOpenMembershipCommand(
  { membershipId: aggregateId.parse(uuidv7()), name, email },
  { correlationId, causationId },
);
```

---

### `decisionState.ts`

**Type:** Decision state union

**What it is.** The `DecisionState` that the decider reads. It is a discriminated union on `status`:

```ts
type DecisionState =
  | { status: "initial"; id: string }
  | { status: "open"; id: string; name: string; email: string };
```

**Why to use it.** The decider must know whether a membership exists before deciding. `DecisionState` is reconstructed by `evolve.ts` by folding past events. It is intentionally minimal — it contains only the fields needed to enforce the business rules in `decide.ts`, not a full view of the aggregate.

---

### `evolve.ts`

**Type:** State reducer (evolve function)

**What it is.** `evolveOpenMembership(aggregateId, events)` folds an array of `MembershipEventV1` events into a `DecisionState`, starting from `{ status: "initial", id: aggregateId }`.

```ts
case "MembershipOpened.v1":
  return { status: "open", id: state.id, name: event.payload.name, email: event.payload.email };
```

**Why to use it.** This is the event sourcing reconstruction step. The repository loads raw events from the store, then calls `evolveOpenMembership` to produce the current state before handing it to the decider. The function is pure — given the same events it always returns the same state — making it trivially testable.

---

### `decide.ts`

**Type:** Decider function

**What it is.** `decideOpenMembership(state, command)` applies business rules and returns an `OpenMembershipDecision`.

**Logic:**
1. Check `MembershipDoesNotAlreadyExist` specification against `state`.
2. If rejected, return `{ accepted: false, rejection: { kind: "rejection", code: "MEMBERSHIP_ALREADY_EXISTS", ... } }`.
3. If accepted, return `{ accepted: true, events: [MembershipOpenedV1], intents: [NotifyUserToVerifyEmailV1] }`.

Key detail: the `MembershipOpenedV1` event is given **two** concerns:

```ts
concerns: [
  createStreamKey(ANCHOR_MEMBERSHIP, state.id),       // "Membership#<id>"
  createStreamKey(ANCHOR_EMAIL, command.payload.email), // "EmailRegistration#<email>"
],
```

This enforces that the same email address cannot be registered twice — the `EmailRegistration` stream key acts as a uniqueness fence across memberships.

**Architecture fit.** Pure function — no I/O, no side effects. Depends only on `DecisionState`, `OpenMembershipCommand`, and the specification.

---

### `decision.ts`

**Type:** Decision type alias

**What it is.** A named alias for the polymorphic `Decision` type from the v5 library, parameterised with the concrete event, intent, and rejection types for this use case:

```ts
export type OpenMembershipDecision = Decision<
  MembershipOpenedV1,
  NotifyUserToVerifyEmailV1,
  MembershipAlreadyExists
>;
```

**Why to use it.** Naming the decision type makes function signatures and test assertions readable and refactoring safe.

---

### `rejections/MembershipAlreadyExists.ts`

**Type:** Rejection type + Notification type

**What it is.** Defines two related types:

- `MembershipAlreadyExists extends Rejection<"MEMBERSHIP_ALREADY_EXISTS">` — the domain rejection returned by the decider when a duplicate is detected.
- `OpenMembershipRejected extends Notification<"OpenMembershipRejected", ..., MembershipAlreadyExists>` — a notification staged in the outbox by `OpenMembershipHandler` on the rejected branch, to inform other systems that the command was rejected.

**Why to use it.** Separates rejection (domain outcome) from notification (integration concern). The handler can stage a `Notification` for external consumers without mixing domain logic with messaging concerns.

---

### `specifications/MembershipDoesNotAlreadyExist.ts`

**Type:** Specification (`EvaluateCandidate<DecisionState>`)

**What it is.** A class implementing `EvaluateCandidate<DecisionState>` from the v5 library. Its single method returns `true` when `candidate.status === "initial"`.

```ts
export class MembershipDoesNotAlreadyExist implements EvaluateCandidate<DecisionState> {
  isSatisfiedBy(candidate: DecisionState): boolean {
    return candidate.status === "initial";
  }
}
```

**Why to use it.** Named specifications make business rules explicit, self-documenting, and independently testable. The `EvaluateCandidate` interface allows the same specification to be composed or reused across multiple deciders without duplication.

---

### `repository.ts`

**Type:** Repository (read-only adapter for event-sourced decision state)

**What it is.** `OpenMembershipRepository` bridges the event store and the decider. It implements only:

- `LoadDecisionState<MembershipEventV1, ResultAsync<DecisionState, GatewayFailure>>` — loads events for both the membership and email stream keys, then calls `evolveOpenMembership`.

```ts
load(membershipId: string, email: string): ResultAsync<DecisionState, GatewayFailure> {
  const streamKeys = [
    createStreamKey(ANCHOR_MEMBERSHIP, membershipId),
    createStreamKey("EmailRegistration", email),
  ];
  return this.eventStore.load(streamKeys).map((events) => evolveOpenMembership(membershipId, events));
}
```

**Why to use it.** The handler should not know about stream keys or event evolution — that is the repository's job. The repository is the single coupling point between the domain model and the event store for reads. It does **not** implement `StoreDomainEvents` — writing an accepted decision's events back is the transactional writer's job (see `TransactionalWriter.InMemory.ts` above and [ADR-0010](../../packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md)), since it must happen atomically with staging the decision's intents, not as an independent repository call.

---

### `handler.ts`

**Type:** Command handler

**What it is.** `OpenMembershipHandler` implements `HandleCommand<OpenMembershipCommand, ResultAsync<OpenMembershipDecision, GatewayFailure[]>>`. It orchestrates the full command processing flow as one neverthrow chain, taking both `writer` (`PersistEventsAndIntents`) and `notifications` (`StageNotifications<OpenMembershipRejected>`) as constructor dependencies:

```
load state → decide → (accepted: atomically append events + intents) | (rejected: stage a rejection notification) → return decision
```

```ts
handle(command: OpenMembershipCommand): ResultAsync<OpenMembershipDecision, GatewayFailure[]> {
  return this.repository
    .load(command.payload.membershipId, command.payload.email)
    .mapErr((failure): GatewayFailure[] => [failure])
    .map((state) => decideOpenMembership(state, command))
    .andThen((decision) =>
      decision.accepted
        ? this.writer
            .persist(decision)
            .mapErr((failure): GatewayFailure[] => [failure])
            .map(() => decision)
        : this.notifications
            .stage([this.toRejectedNotification(command, decision.rejection)])
            .mapErr((failure): GatewayFailure[] => [failure])
            .map(() => decision),
    );
}
```

The two branches use different capabilities on purpose: `writer.persist` needs the shared datasource's transaction (events + intents must land together), while a rejection notification has no atomicity partner — it's staged directly via `StageNotifications` and commits immediately (see `InMemoryDatasource.ts`'s autocommit-outside-a-transaction behaviour). `toRejectedNotification` builds the `OpenMembershipRejected` envelope from the *command* (`payload`, `id`, `metadata`, `type`) plus the decision's `rejection` — `Decision`/`Rejected` alone don't carry enough to build a `Notification`, only the handler has both in scope.

**Return type contract:**
- `Ok(decision)` where `decision.accepted` is `true` or `false` — both an accepted and a rejected decision are success values (ADR-009); the domain saying no is not an infrastructure error.
- `Err(GatewayFailure[])` (always non-empty) — infrastructure failed, either at `load`, at the atomic `persist` write, or while staging the rejection notification. The array holds exactly one failure per call; it exists to give all three failure points one consistent return shape, not because any one point can itself produce more than one failure — see [ADR-0010](../../packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md).

---

### `adapters/inbound/schema.ts`

**Type:** HTTP input schema

**What it is.** Derives the HTTP request body schema from the command payload by omitting `membershipId` (which is server-generated):

```ts
export const openMembershipSchema = openMembershipCommandPayload.omit({ membershipId: true });
```

Keeping it as a separate file means it can be tested independently and imported by the adapter without importing the full command module.

---

### `adapters/inbound/hono.ts`

**Type:** Inbound HTTP adapter (Hono)

**What it is.** `createOpenMembershipInboundHonoAdapter(handler)` creates a Hono sub-router for `POST /membership/open`.

**Responsibilities:**
1. Validates the request body with `sValidator("json", openMembershipSchema)`.
2. Reads `X-Correlation-ID` and `X-Request-ID` headers (generating UUIDs if absent).
3. Generates a server-side `membershipId` (UUID v7).
4. Constructs and dispatches the command.
5. Maps the handler's return type to HTTP responses:
   - `Rejection` → `404` with `{ accepted: false, code }`.
   - Non-empty `GatewayFailure[]` → `500`.
   - Empty `GatewayFailure[]` (success) → `202` with `{ accepted: true, id }`.

---

## Use Cases: Remaining Commands

The following command use cases follow the same file-per-responsibility pattern as `openMembership`. Their files are currently empty stubs that define the expected directory structure. Document them here as each is implemented.

### `acceptTermsOfService`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `specifications/tosVersionMustBeKnown.ts`, `adapters/inbound/http.ts`

**Business intent.** A member accepts a specific version of the terms of service. The decider checks that the ToS version is known (using `tosVersionMustBeKnown`) and produces a `TermsOfServiceAcceptedV1` event.

---

### `activateMembership`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `specifications/{emailMustBeVerified, membershipIsNotAlreadyActive, termsMustBeAccepted}.ts`, `adapters/inbound/http.ts`

**Business intent.** A membership transitions from `open` to `active`. Three specifications must all be satisfied simultaneously: email is verified, terms are accepted, and the membership is not already active.

---

### `changeAddress`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `adapters/inbound/http.ts`

**Business intent.** Update the postal address for an active membership. Produces an `AddressChangedV1` event.

---

### `changeEmail`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `adapters/inbound/http.ts`

**Business intent.** Change the email address on a membership. Invalidates any existing email verification (produces `EmailVerificationInvalidatedV1`) and stages an intent to notify the user to re-verify.

---

### `closeMembership`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `adapters/inbound/http.ts`

**Business intent.** Transition a membership to `closed`. Produces a `MembershipClosedV1` event.

---

### `verifyEmail`

**Files:** `command.ts`, `decide.ts`, `decision.ts`, `handler.ts`, `specifications/emailMustMatchCurrent.ts`, `adapters/inbound/http.ts`

**Business intent.** Mark a member's email as verified using a verification token. The `emailMustMatchCurrent` specification ensures the token corresponds to the address currently on the membership.

---

## Policy: `notifyUserToVerifyEmail`

### `useCases/policies/notifyUserToVerifyEmail/handler.ts`

**Type:** Policy handler (`HandleIntent<NotifyUserToVerifyEmailV1>`)

**What it is.** `NotifyUserToVerifyEmailHandler` reacts to the `NotifyUserToVerifyEmail.v1` intent by sending an email via `EmailGateway`. It uses `intent.id` as the idempotency key so that re-delivery of the same intent does not cause a duplicate email.

```ts
async handle(input: NotifyUserToVerifyEmailV1): Promise<void> {
  await this.email.send({
    to: input.payload.email,
    subject: "Please verify your email",
    body: `Hi ${input.payload.name}, click to verify your email.`,
    idempotencyKey: input.id,
  });
}
```

**Architecture fit.** Policy layer — sits between the outbox (infrastructure) and the email gateway (external system). Registered in `main.ts` against the intent type string `"NotifyUserToVerifyEmail.v1"` and invoked by `IntentRelay`.

---

## Query: `listMemberships`

### `query.ts`

**Type:** Query factory + payload schema

**What it is.** Mirrors the command pattern but for queries. Defines:
- `listMembershipsQueryPayload` — Zod schema with optional `status` filter.
- `createListMembershipsQuery(payload, metadata)` — factory returning a typed `Query<"ListMemberships", ...>`.
- `ListMembershipsQuery` — the inferred return type.

---

### `projection.ts`

**Type:** Projection state + apply function

**What it is.** Defines the read model for the `listMemberships` query:

```ts
export interface MembershipSummary { id: string; name: string; email: string; status: "open" }
export type ListMembershipsProjection = Record<string, MembershipSummary>;
export const emptyProjection: ListMembershipsProjection = {};

export function apply(
  state: ListMembershipsProjection,
  event: MembershipEventV1,
): ListMembershipsProjection {
  switch (event.type) {
    case "MembershipOpened.v1":
      return { ...state, [event.payload.membershipId]: { ... } };
    default:
      return state;
  }
}
```

**Why to use it.** Pure fold function — given the current projection state and one event, returns the new state. Keeping it pure makes it easy to test and reason about. The projector drives this function in a loop; the handler reads the resulting state.

---

### `projector.ts`

**Type:** Read model projector

**What it is.** `ListMembershipsProjector` advances the `ListMembershipsProjection` by processing new events from the event store in batches. It runs on a timer (`tick()` called from `main.ts`).

**Flow per tick:**
1. Load the current checkpoint from the store.
2. Load up to `batchSize` events from `checkpoint + 1`.
3. For each event: load current projection → `apply(current, event)` → save → advance checkpoint.
4. Bail out (silently) on any `GatewayFailure` so the tick is retried next interval.

**Architecture fit.** Application layer. Depends on `InMemoryProjectionStore` (for load/save/checkpoint) and `InMemoryEventStore` (for `loadFrom`). Decoupled from HTTP — it runs independently of any incoming request.

---

### `handler.ts`

**Type:** Query handler

**What it is.** `ListMembershipsHandler` implements `HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>`. It loads the projection and filters by `status` if provided:

```ts
async handle(query): Promise<MembershipSummary[] | GatewayFailure> {
  const projection = await this.store.load();
  if (isFailure(projection)) return projection;
  return Object.values(projection).filter((m) =>
    query.payload.status ? m.status === query.payload.status : true,
  );
}
```

---

### `adapters/inbound/hono.ts`

**Type:** Inbound HTTP adapter (Hono) for query

**What it is.** `createListMembershipsInboundHonoAdapter(handler)` creates a Hono sub-router for `GET /memberships`.

- Validates the `status` query parameter with `sValidator("query", listMembershipsQueryPayload)`.
- Reads tracing headers (`X-Correlation-ID`, `X-Request-ID`).
- Constructs and dispatches the query.
- Maps responses: `GatewayFailure` → `503`; success → `200` with the array of summaries.

---

## Query: `getMembership` (stub)

### `queries.ts`, `projection.ts`, `projector.ts`, `handler.ts`, `adapters/inbound/http.ts`

**Status.** All files are empty stubs. When implemented, this query will return a single membership by id, likely projecting a richer state than `MembershipSummary`.

---

## Patterns and Conventions Summary

| Pattern | Where it appears |
|---------|-----------------|
| Zod value objects with `.brand<"T">()` | `core/domain/*.ts` |
| Stream keys as concurrency fences | `decide.ts`, `repository.ts`, `createStreamKey.ts` |
| `Decision<TEvent, TIntent, TRejection>` discriminated union | `decide.ts`, `decision.ts`, `handler.ts` |
| `EvaluateCandidate` specifications | `specifications/*.ts` |
| `GatewayFailure` returned instead of thrown | all handlers, repos, projectors |
| Outbox pattern for side-effects | `InMemoryOutbox`, `IntentRelay`, `stage()` in handlers |
| Checkpoint-based projector | `ProjectionStore.InMemory`, `projector.ts` |
| Inbound adapter = validator + command factory + HTTP mapping | `adapters/inbound/hono.ts` |
| Command payload schema reused in HTTP schema | `schema.ts` (omit server-side fields) |
