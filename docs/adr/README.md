# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for `packages/v5`.

> The v4 ADRs (001–007) now live alongside the v4 package at
> [`packages/v4/docs/adr`](../../packages/v4/docs/adr/README.md).

## What is an ADR?

An ADR captures a significant architectural decision, the context that led to it, the alternatives considered, and the consequences of the choice. ADRs help future maintainers understand **why** the codebase is structured the way it is.

## Format

We use a lightweight Markdown format inspired by [MADR](https://adr.github.io/madr/):

- **Date:** When the decision was made
- **Status:** Accepted | Superseded | Deprecated
- **Context:** The problem or question that prompted the decision
- **Decision:** What was decided
- **Rationale:** Why this decision was made
- **Consequences:** Positive and negative outcomes
- **Alternatives Considered:** Other options and why they were rejected
- **References:** Links to related ADRs, documentation, or external resources

## Index

### v5 neverthrow Pipeline (2026-07)

- [ADR-008: Inbound Pipeline Uses neverthrow Instead of Middleware Frameworks](./008-inbound-pipeline-uses-neverthrow-not-middleware-frameworks.md)
- [ADR-009: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel](./009-outbound-ports-return-resultasync-rejection-stays-in-ok.md)
- [ADR-010: Validation Is an Invalid Outcome; Outcomes Share an Outcome Base](./010-validation-is-an-invalid-outcome-not-a-rejection.md)
- [ADR-011: Events and Intents Persist Atomically via a Transactional Writer](./011-events-and-intents-persist-atomically-via-a-transactional-writer.md)

## Contributing

When making a significant architectural decision:

1. Copy the template from an existing ADR
2. Fill in all sections (especially Rationale and Alternatives Considered)
3. Number sequentially (next available number)
4. Add to the index above
5. Submit as part of your PR

## References

- [Architecture Decision Records (Backstage)](https://backstage.io/docs/architecture-decisions)
- [MADR: Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [AWS: Using ADRs to Streamline Technical Decision-Making](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/welcome.html)
- [Google Cloud: Architecture Decision Records Overview](https://cloud.google.com/architecture/architecture-decision-records)
