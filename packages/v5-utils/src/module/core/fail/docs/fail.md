# fail

> Returns a thunk that throws the given error — designed for use with `invariant`.

## What it is

`fail` is a utility for deferred error throwing. It takes an `Error` instance
and returns a zero-argument function (`() => never`) that throws it when called.
This keeps error construction eager — the error message is evaluated immediately,
including any stack trace — while deferring the throw itself.

Its primary role is as the second argument to [`invariant`](../../invariant/docs/invariant.md).
Together they form a readable, SOLID-friendly assertion pattern: the assertion
states the condition that _must_ hold, and `fail` describes what happens when it
does not. This keeps code at the domain boundary clean and explicit without
scattering `if (!condition) throw new Error(...)` blocks through business logic.

## Interface

```typescript
export function fail(error: Error): () => never;
```

## Usage

```typescript
import { fail, invariant } from "@arts-and-crafts/v5-utils/core";

// Assert a condition; throw a typed error if it is not met
invariant(user.isActive, fail(new Error("Cannot place order for inactive user")));
```

`fail` can also be called directly when a throw-expression would otherwise be
needed in a position that requires an expression, not a statement:

```typescript
const handler =
  handlerMap.get(command.type) ?? fail(new Error(`No handler registered for ${command.type}`))();
```

## Related

- **Tests**: [`fail.spec.ts`](../fail.spec.ts)
- **Used by**: [`invariant`](../../invariant/docs/invariant.md)
