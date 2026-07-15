# parseAsError

> Converts any unknown value to an `Error` instance.

## What it is

TypeScript types `catch` block bindings as `unknown`. Before you can read a
message, log, or wrap the thrown value you have to narrow it. `parseAsError`
does that narrowing in one call, producing a typed `Error` regardless of what
was thrown.

The conversion rules are:

| Input type                  | Result                             |
| --------------------------- | ---------------------------------- |
| `Error` instance            | returned as-is (no wrapping)       |
| `string`                    | `new Error(value)`                 |
| JSON-serialisable value     | `new Error(JSON.stringify(value))` |
| circular / non-serialisable | `new Error('Unknown error')`       |

In a **hexagonal / clean architecture** the infrastructure layer is the only
place I/O — and therefore exceptions — originate. `parseAsError` lives at that
boundary: use it in adapter code and infrastructure implementations to normalise
whatever a third-party library or runtime throws into the typed `Error` that the
rest of the application expects.

## Interface

```typescript
export function parseAsError(value: unknown): Error;
```

## Usage

```typescript
import { parseAsError } from "@utils/parseAsError/parseAsError.ts";

try {
  await externalService.call();
} catch (err) {
  const error = parseAsError(err);
  logger.error(error.message);
  throw error;
}
```

Also useful when mapping `Result` errors from oxide.ts or similar:

```typescript
const result = await someOperation();
if (result.isErr()) {
  throw parseAsError(result.unwrapErr());
}
```

## Related

- **Tests**: [`parseAsError.spec.ts`](../parseAsError.spec.ts)
