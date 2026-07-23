# Rule: No `_unsafeUnwrap()` / `_unsafeUnwrapErr()` in Tests

**Applies to:** tests in `packages/v5` and `examples/v5`

## Rule

Don't use neverthrow's `_unsafeUnwrap()`/`_unsafeUnwrapErr()` to pull a value
out of a `Result`/`ResultAsync` in a test. Use `.match()` instead, throwing an
explicit, descriptive error on the rail you don't expect.

## Why

`_unsafeUnwrap()` throws neverthrow's own internal error when a result lands
on the unexpected rail — a generic message that doesn't say what the test
expected or what it actually got. A `.match()` that throws its own error
surfaces the actual failure value in the message, so a failing test tells you
what happened at the point it failed, not just that something did.

## Example

Before:

```ts
const state = (await repository.load(id, email))._unsafeUnwrap();
```

After:

```ts
const state = (await repository.load(id, email)).match(
  (state) => state,
  (failure) => {
    throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
  },
);
```

The `Err`-side equivalent — throw on the `Ok` branch instead — applies the
same way for tests asserting a result lands on the `Err` rail:

```ts
const failure = (await repository.load(id, email)).match(
  (state) => {
    throw new Error(`Expected Err, got Ok: ${JSON.stringify(state)}`);
  },
  (failure) => failure,
);
```

See `examples/v5/modules/membership/useCases/commands/openMembership/repository.test.ts`
for the pattern in use.
