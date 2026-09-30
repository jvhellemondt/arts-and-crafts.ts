# Rule: Use `node:assert` for Runtime Assertions

**Applies to:** `packages/v5*` and `examples/v5`

## Rule

Assert preconditions and invariants with `node:assert`. Don't add hand-rolled
`invariant`/`fail` helpers for it.

## Why

`assert(condition, message)` already throws when the condition is false, and
its `asserts value` signature narrows types the same way a custom `invariant`
does. A second helper duplicates the standard library and has to be tested
and documented on its own.

## Example

Before:

```ts
invariant(loosened.length === 0, fail(new Error(`metadata must require ${loosened.join(", ")}`)));
```

After:

```ts
import assert from "node:assert";

assert(loosened.length === 0, `metadata must require ${loosened.join(", ")}`);
```
