# Rule: No Comments in Code

**Applies to:** `packages/v5*` and `examples/v5`

## Rule

Don't write comments (`//`, `/* */` or JSDoc) in source or test files. When you
touch a file, remove the comments already in it too.

The one exception is compiler directives the code depends on, such as a
bare `// @ts-expect-error` in a type-level test.

## Why

Comments drift from the code they describe, and nothing checks them. Intent
belongs in names, types and tests. Longer explanations belong in the
co-located `docs/*.md` for a concept, or in an ADR for a decision.

## Example

Before:

```ts
// A concern's version is how many events carry it.
private versionsFor(concerns: readonly StreamKey[]) {
```

After:

```ts
private versionsFor(concerns: readonly StreamKey[]) {
```
