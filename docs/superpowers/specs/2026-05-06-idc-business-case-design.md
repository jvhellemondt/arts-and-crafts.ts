# Design: IDC Business Case Documentation

## Summary

Document a realistic business case for the `packages/v5/examples` by modelling the **Institute of Digital Craftsmanship (IDC)** — a fictional professional membership body for software practitioners. The documentation takes the form of outputs from a series of DDD design sessions, giving library consumers a coherent domain narrative that explains every design decision in the Membership bounded context code.

## Approach

Layered documentation: a concise overview (`README.md`) plus one file per DDD session, stored at `packages/v5/examples/docs/business-case/`.

## Domain

**Organisation:** Institute of Digital Craftsmanship (IDC)  
**Type:** Professional membership association  
**Nine bounded contexts:** Membership (implemented), Accreditation, CPD, Events, Payments, Communications, Notifications, Conduct & Governance, Public Registry

## File Structure

```
packages/v5/examples/docs/business-case/
├── README.md                      — overview, 9 BC table, navigation guide
├── 01-big-picture.md              — domain event landscape
├── 02-process-modelling.md        — actors, commands, policies per flow
├── 03-software-design.md          — aggregates, systems, read models
├── 04-domain-event-timeline.md    — chronological member journey
├── 05-hotspots.md                 — pain points and resolutions
├── 06-bounded-context-candidates.md — context definitions
├── 07-aggregate-command-policy.md — full command catalogue
├── 08-value-stream-mapping.md     — value stream and waste
├── 09-opportunity-mapping.md      — automation opportunities
├── 10-context-mapping.md          — integration patterns
├── 11-event-sourcing-design.md    — Decider pattern design
└── 12-bdd-pivot.md                — BDD scenarios per command
```

## Session Document Format

Each file follows: Purpose → Participants → Key Discoveries → Artefacts → Contested Areas & Alternatives Considered → What This Led To.

"All possible outcomes" are captured in the **Contested Areas** section of each session file.
