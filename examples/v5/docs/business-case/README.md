# The Institute of Digital Craftsmanship — Domain Overview

## Mission

The Institute of Digital Craftsmanship (IDC) is a professional membership body for software practitioners who commit to the principles of technical craftsmanship: continuous learning, ethical practice, and peer accountability. The IDC provides professional standing through membership, certifications, CPD tracking, and a public registry of verified practitioners.

## Nine Bounded Contexts

| # | Context | Responsibility | Core Aggregates | Subdomain |
|---|---------|---------------|-----------------|-----------|
| 1 | **Membership** | Member identity, lifecycle, and profile | `Membership` | Core |
| 2 | **Accreditation** | Certifications, assessments, competency levels | `Certification`, `Assessment` | Core |
| 3 | **CPD** | Continuing Professional Development tracking | `CPDRecord`, `CPDActivity` | Core |
| 4 | **Events** | Conferences, workshops, webinars | `Event`, `Registration` | Supporting |
| 5 | **Payments** | Fees, invoicing, renewal billing | `Invoice`, `Subscription` | Supporting |
| 6 | **Communications** | Newsletters, announcements, campaigns | `Announcement`, `Newsletter` | Supporting |
| 7 | **Notifications** | Email/SMS/push delivery and status | `Notification` | Generic |
| 8 | **Conduct & Governance** | Code of conduct, complaints, sanctions | `Complaint`, `Hearing` | Supporting |
| 9 | **Public Registry** | Searchable directory of verified members | `MemberProfile` | Supporting |

## How the Code Maps to the Domain

The `examples/modules/membership/` directory implements the **Membership** bounded context. The remaining eight bounded contexts are documented in these session outputs to provide the realistic domain context that a professional association requires — they explain *why* the Membership design made the decisions it did: why email verification is an explicit lifecycle step, why TOS versioning is a first-class domain concept, why address capture is optional at registration but present in the model, and why the intent/outbox pattern is used for side effects like sending mail.

## Reading Guide

| File | Session | What it adds |
|------|---------|-------------|
| `01-big-picture.md` | Big Picture | Domain-wide event landscape across all nine contexts |
| `02-process-modelling.md` | Process Modelling | Actors, commands, and policies per business flow |
| `03-software-design.md` | Software Design | Aggregates, external systems, and read models |
| `04-domain-event-timeline.md` | Domain Event Timeline | Chronological member journey with branching paths |
| `05-hotspots.md` | Hotspots | Pain points, open questions, and contested decisions |
| `06-bounded-context-candidates.md` | Bounded Contexts | Context responsibilities, boundaries, and ownership |
| `07-aggregate-command-policy.md` | Aggregate/Command/Policy | Detailed command, event, and policy structures |
| `08-value-stream-mapping.md` | Value Stream | Member value journey and waste identified |
| `09-opportunity-mapping.md` | Opportunity Mapping | Where automation and event sourcing add value |
| `10-context-mapping.md` | Context Mapping | Integration patterns between bounded contexts |
| `11-event-sourcing-design.md` | Event Sourcing Design | Design decisions for the Membership BC |
| `12-bdd-pivot.md` | BDD Pivot | Executable scenarios per command with all outcomes |
