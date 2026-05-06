# Design: IDC Business Case — Mermaid Visuals

## Summary

Add Mermaid diagrams to 10 of the 13 business case files. Rendering target: GitHub markdown (native Mermaid support). Files with dense structured text that needs no visual supplement (hotspots, bounded-context catalogue, README) left as-is.

## Diagram Inventory

| File | Type | Diagram count |
|------|------|:---:|
| `01-big-picture.md` | `timeline` | 1 |
| `02-process-modelling.md` | `sequenceDiagram` | 2 |
| `03-software-design.md` | `graph TD` | 1 |
| `04-domain-event-timeline.md` | `flowchart TD` | 1 |
| `07-aggregate-command-policy.md` | `stateDiagram-v2` | 1 |
| `08-value-stream-mapping.md` | `flowchart LR` | 1 |
| `09-opportunity-mapping.md` | `quadrantChart` | 1 |
| `10-context-mapping.md` | `graph TB` | 1 |
| `11-event-sourcing-design.md` | `flowchart TD` | 1 |
| `12-bdd-pivot.md` | `stateDiagram-v2` | 1 |

**Total:** 11 mermaid blocks across 10 files.

## Files with no diagram (intentional)

- `README.md` — navigation index; no diagram needed
- `05-hotspots.md` — tabular decisions; prose is the right format
- `06-bounded-context-candidates.md` — structured catalogue; tables suffice
