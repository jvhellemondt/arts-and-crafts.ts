/**
 * High-water mark in the global event log, used as the optimistic-concurrency
 * token for Dynamic Consistency Boundaries. It is the store-wide
 * `globalPosition` observed at read time; `0` means "no events seen".
 */
export type ConsistencyPosition = number;
