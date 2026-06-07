# Architecture Summary: Modular FCIS with Event Sourcing

## Architectural Philosophy

The system applies **Functional Core Imperative Shell (FCIS)** within a **modular vertical slice** structure, organized as a bounded context containing multiple business contexts, each containing use cases. See **ADR-0001**.

The system is fully **event-centric** — domain events, intents, and technical events are all modelled explicitly as structured types. There is no logging.

---

## Layer Hierarchy

The structure follows three levels: bounded context at the top, business context (module) in the middle, and use case (vertical slice) at the bottom. Each level has a shared folder for cross-cutting concerns. The shell is the only place with full visibility and is responsible for all wiring. See **ADR-0001**.

---

## Functional Core

The core is pure — no I/O, no side effects, no infrastructure dependencies. Per module it contains events, intents, and shared projection mappings; each command owns its decision state and the evolve that folds its boundary, rather than sharing a module-wide aggregate state. See **ADR-0014**.

**Events** are domain facts. They live at the module level and are shared across all use cases within that module.

**Intents** that are domain-expressed consequences of a decision also live at module level. Cross-cutting intents such as rejection notifications are added by the application layer, not the decider.

**Evolve** is a pure state evolution function that folds a single event into the current state. It is owned by the command (one decision state per command), and state reconstruction happens before every command by folding the events inside that command's consistency boundary through its evolve. See **ADR-0005** and **ADR-0014**.

**The decider** is use case specific and co-located with its command. It is always a pure function taking current state and a command, returning a Decision. It never expresses how outcomes are communicated to callers.

---

## Decision Type

Each use case defines its own Decision type with two variants: Accepted carrying events and intents, or Rejected carrying a typed domain rejection reason — never a string. The decider never adds rejection notification intents. That is the application layer's responsibility applied uniformly across all commands. See **ADR-0003** and **ADR-0005**.

---

## Use Case Structure

Each use case owns its input type (command or query), its output type (decision for commands, projection for queries), an imperative handler that orchestrates pure core functions, and inbound adapters — one per transport. Inbound adapters are named by technology and belong to the use case they serve. See **ADR-0001**, **ADR-0005**, **ADR-0006**.

---

## Command Handling Pattern

Every command follows the same lifecycle without exception. See **ADR-0005**, superseded by **ADR-0014**.

The inbound adapter translates the transport payload into a domain command and calls the command handler. The command carries `tags` rather than aggregate coordinates; the handler derives a dynamic consistency boundary query from those tags, reads the matching events together with the store-wide position, reconstructs current state by folding them through evolve, and calls the pure decider. If the decision is Accepted, the handler appends events under an append condition (the query plus the read position) and writes domain intents to the outbox; a violated condition surfaces as an AppendConflict. If the decision is Rejected, the handler writes an InformCallerOfRejection intent to the outbox as a cross-cutting application policy. Technical events are written at every meaningful boundary throughout. The result is returned to the inbound adapter which translates it to the appropriate transport response. See **ADR-0014**.

For HTTP callers, rejection is communicated both synchronously as a 4xx response and asynchronously via the outbox through to the Kafka results topic. For event-driven callers (message queue, internal channel) there is no synchronous response — only the async notification via outbox.

---

## Query Handling Pattern

Query handlers read from pre-built projections. They never touch the event store or the command side. See **ADR-0006**.

The inbound adapter translates the transport payload into a domain query and calls the query handler. The handler reads from the projection store and returns the result. The inbound adapter translates the result to the transport response.

Projections are built and maintained by a projector that tails the event store asynchronously. Projections are eventually consistent. Each query use case owns its own projection — projections are never shared between query handlers.

---

## Incoming Event Handling Pattern

Incoming events from message queues, internal channels, or HTTP are just another inbound trigger. See **ADR-0007**.

The inbound event adapter translates the external schema into an internal type — either a command or a domain event. External schemas never leak past the adapter. If the event triggers a decision it is translated to a command and goes through the full command lifecycle. If it only updates a read model it is fed directly to the projector. The routing decision is explicit in the adapter, not dynamically dispatched. Idempotency is handled at the command level — duplicate events result in a non-error rejection.

---

## Intent and Outbox Pattern

Intents are domain vocabulary expressing what should happen elsewhere as a consequence of a decision. See **ADR-0003**.

Domain intents are produced by the decider as part of an Accepted decision and live in the module core. Application intents such as InformCallerOfRejection are added by the command handler as cross-cutting policy and never by the decider.

The outbox provides at-least-once delivery. Intents are written atomically with domain events. The intent relay is the only place that knows about brokers, topics, and external targets — it translates domain vocabulary into infrastructure messages.

---

## Intent Relay Pattern

One relay per intent type. The intent relay runner is a background polling task spawned at startup. See **ADR-0008**.

When the runner finds an undelivered outbox record, it dispatches to the matching relay. The relay translates the domain intent into the appropriate infrastructure message, delivers it to the external system, marks the record delivered, and writes technical events throughout. Retry uses exponential backoff. After a configured number of attempts the record is dead lettered for manual intervention. The outbox record ID is carried to the external system as an idempotency key.

---

## Event Relay Pattern

One relay per module. The event relay runner is a background polling task that tails the event store from a checkpoint position. See **ADR-0009**.

The runner polls for new events and dispatches each to the event relay. The relay translates the domain event into a versioned integration event and publishes it to the module's bounded context Kafka topic, using the aggregate ID as the message key to preserve ordering per aggregate. The event type and version are carried as message headers so consumers can filter. The checkpoint advances only after Kafka acknowledgement — never before. Breaking schema changes use parallel versioned publishing during a migration window. External services never read the domain event store directly.

---

## Technical Event Pattern

Every I/O boundary captures structured technical events. There is no logging. See **ADR-0004**.

Technical events are written by inbound and outbound adapters at every boundary. Writing is fire-and-forget and never blocks the main flow. The TechnicalEventStore port is injected into all adapters and is the one intentional cross-cutting exception to the inbound/outbound separation. Technical events are consumed by monitoring and analysis systems. They are kept strictly separate from domain events and integration events.

---

## Three Stores

The system maintains three distinct stores with different purposes, write patterns, and consumers.

The **domain event store** is the source of truth. It is an append-only log of tagged events with no per-aggregate streams; consistency boundaries are selected dynamically by query (see **ADR-0014**). It is written transactionally with the intent outbox. It is consumed by the application for state reconstruction, by projectors for building read models, and tailed by the event relay for external broadcast.

The **intent outbox** is a durable buffer for directed intents requiring guaranteed delivery. It is written transactionally with the event store. It is consumed by intent relays.

The **technical event store** captures I/O observation facts. It is written fire-and-forget at every adapter boundary. It is consumed by monitoring and analysis systems. See **ADR-0004**.

---

## Outbound Adapters

Outbound adapters are named by function and shared across use cases within a module. Their ports are defined in the shared infrastructure layer. Implementations are named by technology. Inbound adapters are named by technology because the technology is the reason they exist. See **ADR-0001**.

---

## Runtime Model

A single long-running Rust process. `shell/main.rs` is the composition root. See **ADR-0002**.

The shell reads config from environment variables, instantiates infrastructure implementations, wires them into use case handlers, spawns background workers via `tokio::spawn`, and starts the HTTP server. Use cases have no knowledge of the runtime model or any deployment concern. The same binary runs locally and in production.

---

## Naming Conventions

**Inbound adapters** are named by technology because the technology is the reason they exist.

**Outbound adapters** are named by function because the port defines capability, with implementations named by technology.

**Modules** are named by business context.

**Use cases** are named by operation.

---

## ADR Index

| ADR | Title |
|---|---|
| ADR-0001 | Modular FCIS folder structure and rationale |
| ADR-0002 | Long-running process and tokio runtime model |
| ADR-0003 | Intent and outbox pattern |
| ADR-0004 | Technical event pattern |
| ADR-0005 | Command handling pattern |
| ADR-0006 | Query handling pattern |
| ADR-0007 | Incoming event handling pattern |
| ADR-0008 | Intent relay pattern |
| ADR-0009 | Event relay pattern |
| ADR-0010 | Projector pattern |
| ADR-0011 | Projection rebuild strategy |
| ADR-0012 | Specification pattern for business rules |
| ADR-0013 | Event bus and event store read model |
| ADR-0014 | Dynamic Consistency Boundaries |

---

## Not Yet Captured in ADRs

The following were discussed or identified as gaps without a formal ADR.

~~**Projector runner** — how the projector tails the event store, checkpoint management, and rebuild strategy.~~

**Event store table design** — partition key strategy, optimistic concurrency control, schema design.

**State and evolve as a formal pattern** — pure functional state reconstruction as a standalone ADR.

**Snapshot pattern** — mitigation for slow state reconstruction on aggregates with long event histories.

**Correlation and causation IDs** — how trace IDs flow through commands, events, intents, and relay messages across workers and services.

**Local development setup** — full wiring of the in-memory stack and how developers run the system locally.

**Dead letter replay tooling** — inspection, correction, and replay of dead lettered intents and events.

**Schema registry** — enforcement of integration event schema contracts between producers and consumers.

**Consumer contract testing** — detecting breaking schema changes before deployment.

**Aggregate boundary decisions** — rules for deciding what constitutes an aggregate.

~~**Projection rebuild strategy** — how projections are cleared and rebuilt during replay, and how queries are served during a rebuild.~~
