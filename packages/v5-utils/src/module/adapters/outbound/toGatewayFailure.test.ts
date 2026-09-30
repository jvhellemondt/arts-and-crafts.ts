import { ResultAsync } from "neverthrow";
import { toGatewayFailure } from "./toGatewayFailure.ts";

describe("toGatewayFailure", () => {
  it("builds a gateway failure naming the gateway, with what it threw as the cause", () => {
    const cause = new Error("connection refused");

    expect(toGatewayFailure("EventStore", "append failed")(cause)).toEqual({
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "EventStore",
      reason: "append failed",
      cause,
    });
  });

  it("keeps a cause that is not an Error as is", () => {
    expect(toGatewayFailure("EventStore", "append failed")("timeout").cause).toBe("timeout");
  });

  it("maps a rejected promise when used as the fromPromise error mapper", async () => {
    const cause = new Error("throttled");

    const failure = (
      await ResultAsync.fromPromise(Promise.reject(cause), toGatewayFailure("Queue", "send failed"))
    ).match(
      (value) => {
        throw new Error(`Expected Err, got Ok: ${JSON.stringify(value)}`);
      },
      (failure) => failure,
    );

    expect(failure).toMatchObject({ gateway: "Queue", cause });
  });
});
