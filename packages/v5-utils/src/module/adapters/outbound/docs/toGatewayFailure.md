# toGatewayFailure

> Builds the error mapper that turns whatever a gateway threw into a `GatewayFailure`.

## What it is

An outbound adapter wraps each I/O call in `ResultAsync.fromPromise`, whose
second argument maps the rejection to the `Err` value. For I/O that value is
always the same shape — a `GatewayFailure` naming the gateway that failed, with
what it threw kept as the `cause` — so writing it out by hand at every call site
only leaves room for the shape to drift.

`toGatewayFailure` takes the parts that differ per call site, the `gateway` and
the `reason`, and returns that mapper. The thrown value is carried as `cause`
untouched: it is `unknown`, and whoever logs or inspects the failure is better
placed to narrow it (see [`parseAsError`](../../../core/parseAsError/docs/parseAsError.md)).

## Interface

```typescript
export function toGatewayFailure(
  gateway: string,
  reason: string,
): (cause: unknown) => GatewayFailure;
```

## Usage

```typescript
import { toGatewayFailure } from "@arts-and-crafts/v5-utils/adapters/outbound";
import { ResultAsync } from "neverthrow";

send(event: IntegrationEvent): ResultAsync<void, GatewayFailure> {
  return ResultAsync.fromPromise(
    this.client.send({ queueUrl: this.queueUrl, body: JSON.stringify(event) }),
    toGatewayFailure(this.queueUrl, `failed to queue integration event ${event.id}`),
  ).map(() => undefined);
}
```

It can also be called directly where only some rejections are gateway
failures, for example after ruling out a concurrency conflict:

```typescript
(error) =>
  isConditionalCheckFailure(error)
    ? {
        kind: "failure",
        code: "CONCURRENCY_CONFLICT",
        gateway: this.table,
        reason: "append failed",
        cause: error,
      }
    : toGatewayFailure(this.table, "append failed")(error);
```

## Related

- **Tests**: [`toGatewayFailure.test.ts`](../toGatewayFailure.test.ts)
