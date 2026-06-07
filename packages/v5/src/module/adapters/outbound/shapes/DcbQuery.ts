import type { Tag } from "@core/shapes/Tag.ts";

/**
 * A single selection criterion within a {@link DcbQuery}. An event matches a
 * criterion when its type is one of `types` (or `types` is omitted, meaning any
 * type) AND it carries every tag in `tags`. Within a criterion `tags` are
 * AND-ed and `types` are OR-ed.
 */
export interface Criterion {
  /** Event types to match (OR-ed). Omitted means "any type". */
  readonly types?: readonly string[];
  /** Tags that must all be present on the event (AND-ed). */
  readonly tags: readonly Tag[];
}

/**
 * The dynamic consistency boundary of a decision: a disjunction of criteria.
 * An event matches the query when it matches any criterion. An empty `criteria`
 * array matches no events.
 */
export interface DcbQuery {
  readonly criteria: readonly Criterion[];
}
