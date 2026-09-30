# invariant

> Asserts that a condition holds; calls a handler (and never returns) if it does not.

## What it is

`invariant` is a TypeScript assertion utility that enforces preconditions and
invariants at runtime. It takes a boolean `condition` and a `() => never`
callback. When the condition is `false`, it calls the callback — which is
expected to throw — and TypeScript's control-flow analysis narrows the type of
any value that follows the assertion, eliminating the need for manual null
checks or type casts downstream.

In a **clean / hexagonal architecture**, `invariant` belongs at the boundary
between layers: in application-layer handlers to enforce preconditions before
delegating to the domain, or inside domain objects to protect invariants.
Keeping guard logic explicit and co-located with the business rule it protects
is a SOLID (Single Responsibility, Open/Closed) practice — each `invariant` call
documents one rule and nothing else.

Pair it with [`fail`](../../fail/docs/fail.md) to produce typed, descriptive
errors without boilerplate:

```typescript
invariant(order.isPending, fail(new Error("Order is no longer pending")));
```

## Interface

```typescript
export function invariant(condition: boolean, onInvalid: () => never): asserts condition;
```

The `asserts condition` return type integrates with TypeScript's control-flow
narrowing — after a passing `invariant` call the compiler knows the condition
is `true`.

## Usage

```typescript
import { fail, invariant } from "@arts-and-crafts/v5-utils/core";

function activateUser(user: User | null): ActiveUser {
  invariant(user !== null, fail(new Error("User not found")));
  // TypeScript now knows user is User (not null)

  invariant(user.status === "pending", fail(new Error("User cannot be activated")));
  // TypeScript now knows user.status === 'pending'

  return user.activate();
}
```

## Related

- **Tests**: [`invariant.spec.ts`](../invariant.spec.ts)
- **Pairs with**: [`fail`](../../fail/docs/fail.md)
