# v5 Example App — Institute of Digital Craftsmanship

> **This is a reference/example app, not a production service.** It exists to
> show how the `@arts-and-crafts/v5` library's CQRS, DDD, and event-sourcing
> building blocks fit together in a runnable application. Storage is
> in-memory and resets on every restart.

## Quick start

This example depends on `packages/v5` via `workspace:*`, resolved through its
built `dist/`. Build the library once (and again whenever it changes) before
running anything here:

```bash
pnpm --filter @arts-and-crafts/v5 run build
```

Then, from this directory (`examples/v5`):

```bash
pnpm install       # if you haven't already, from the repo root
pnpm run dev        # start the Hono dev server on :3000
```

Open a membership:

```bash
curl -X POST http://localhost:3000/membership/open \
  -H "Content-Type: application/json" \
  -d '{"name": "Ada Lovelace", "email": "ada@example.com"}'
```

List memberships:

```bash
curl http://localhost:3000/memberships
```

### Dev-loop commands

Every command below can be run either via `pnpm run <script>` or via the
[justfile](./justfile) (`just <recipe>`), which also wires in the
`packages/v5` build step where it's needed:

| Command | What it does |
|---|---|
| `pnpm run dev` / `just dev` | Run the Hono app with file watching |
| `pnpm run lint` / `just lint` | Lint `shell/`, `modules/`, `shared/` |
| `pnpm run lint:fix` / `just lint-fix` | Lint and auto-fix |
| `pnpm run fmt` / `just fmt` | Format the codebase |
| `pnpm run fmt:check` / `just fmt-check` | Check formatting without writing |
| `pnpm run typecheck` / `just typecheck` | `tsc --noEmit` |
| `pnpm run test` / `just test` | Run tests once |
| `pnpm run test:watch` / `just test-watch` | Watch mode with coverage |
| `pnpm run test:ui` / `just test-ui` | Watch mode with the Vitest UI |
| `pnpm run coverage` / `just coverage` | Run tests with coverage |
| `just check` | `lint` + `typecheck` + `coverage` in one go |

## Architecture

The app implements a single bounded context — **Membership** — using CQRS
and event sourcing, laid out in four directories:

```
examples/v5/
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
└── shell/            # Application wiring and entrypoints (Hono, Lambda)
```

The domain layer (`core/`) never imports from infrastructure — everything
flows through typed capability interfaces (`LoadDomainEvents`,
`AppendToEventStore`, etc.) defined by the v5 library.

### Request flow

```
Inbound Adapter (hono.ts / lambda.ts)
  — validates input with a Zod schema
  — constructs a typed Command or Query
        │
        ▼
Handler (handler.ts)
  — loads a Decider's state via the Repository (commands)
    or loads a Projection (queries)
  — calls decide() to turn a command into events (commands only)
  — appends events to the EventStore (commands)
  — stages intents in the Outbox (commands)
        │
        ▼
EventStore (append-only log) · Outbox (pending intents) · ProjectionStore (read model)
        │
        ▼
Background workers
  — IntentRelay: drains the Outbox and dispatches to intent handlers
  — Projector: advances a read model by folding new events
```

### Key patterns, with an example

`openMembership` (`modules/membership/useCases/commands/openMembership/`)
exercises the full write path:

- **Decider** — `decide.ts` / `evolve.ts` are pure functions: `decide(command, state) → events[]`
  and `evolve(state, event) → state`. No side effects, easy to unit test.
- **Specification** — `specifications/MembershipDoesNotAlreadyExist.ts` is a
  composable predicate the decider consults before allowing the command.
- **EventStore** — `shared/adapters/outbound/EventStore.InMemory.ts` is the
  append-only log the Repository reads/writes `MembershipEventV1`s to.
- **Outbox / IntentRelay** — opening a membership stages a
  `NotifyUserToVerifyEmail` intent in `shared/adapters/outbound/Outbox.InMemory.ts`;
  `shared/adapters/outbound/IntentRelay.ts` polls the outbox and dispatches
  each intent to its handler (see `useCases/policies/notifyUserToVerifyEmail/`).
- **Projection** — `listMemberships` (`useCases/queries/listMemberships/`)
  shows the read side: a `Projector` folds `MembershipEventV1`s into a
  `ListMembershipsProjection` stored in an in-memory `ProjectionStore`.

`shell/main.ts` wires all of the above together and exposes it two ways —
`shell/apps/hono/index.ts` for HTTP, and `shell/apps/lambda/*/index.ts` for
AWS Lambda — both driving the same handlers.

### Going deeper

- [`COMPONENTS.md`](./COMPONENTS.md) — a reference entry for every
  non-test source file in this app.
- [`docs/business-case/`](./docs/business-case) — the domain-modelling
  story behind the Membership bounded context (event storming, aggregate
  design, BDD scenarios) and how it fits the wider Institute of Digital
  Craftsmanship domain.
