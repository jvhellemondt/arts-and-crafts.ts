# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the `@arts-n-crafts/ts` library.

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

### v4 ScenarioTest Implementation (2026-02-18)

- [ADR-001: Rejection is Not a Domain Event](./001-rejection-is-not-a-domain-event.md)
- [ADR-002: Outbox Owns IntegrationEvent Conversion](./002-outbox-owns-integration-event-conversion.md)
- [ADR-003: Command Handler Orchestrates Rejection Publishing](./003-command-handler-orchestrates-rejection-publishing.md)
- [ADR-004: Decider Returns Rejection for Business Rule Violations](./004-decider-returns-rejection-for-business-rule-violations.md)
- [ADR-005: ScenarioTest Asserts Rejections via Outbox](./005-scenario-test-asserts-rejections-via-outbox.md)
- [ADR-006: Projection Handlers Guard on isDomainEvent](./006-projection-handlers-guard-on-is-domain-event.md)
- [ADR-007: ScenarioTest Given Step Publishes to Event Bus](./007-scenario-test-given-publishes-to-event-bus.md)

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

