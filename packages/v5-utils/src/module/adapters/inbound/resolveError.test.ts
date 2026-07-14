import { z } from "zod";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { resolveError } from "./resolveError.ts";

const REJECTION: Rejection<"MEMBERSHIP_ALREADY_EXISTS"> = {
  kind: "rejection",
  code: "MEMBERSHIP_ALREADY_EXISTS",
  reason: "Membership already exists",
};

const FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "EventStore",
  reason: "Connection refused",
};

describe("resolveError", () => {
  it("maps a ZodError to 400 with the flattened error as body", () => {
    const zodError = z.object({ name: z.string() }).safeParse({}).error!;
    const outcome = resolveError(zodError, {});
    expect(outcome.status).toBe(400);
    expect(outcome.body).toEqual(zodError.flatten());
  });

  it("maps a Rejection to the default 400 with its own reason when no hook is registered", () => {
    const outcome = resolveError(REJECTION, {});
    expect(outcome).toEqual({
      status: 400,
      body: { code: "MEMBERSHIP_ALREADY_EXISTS", reason: "Membership already exists" },
    });
  });

  it("uses the onRejection hook's status and falls back to the rejection's reason when no message is returned", () => {
    const outcome = resolveError(REJECTION, { onRejection: () => [404] });
    expect(outcome).toEqual({
      status: 404,
      body: { code: "MEMBERSHIP_ALREADY_EXISTS", reason: "Membership already exists" },
    });
  });

  it("uses the onRejection hook's message override when provided", () => {
    const outcome = resolveError(REJECTION, { onRejection: () => [409, "custom message"] });
    expect(outcome).toEqual({
      status: 409,
      body: { code: "MEMBERSHIP_ALREADY_EXISTS", reason: "custom message" },
    });
  });

  it("maps a GatewayFailure[] to the default 500 with the first failure's reason when no hook is registered", () => {
    const outcome = resolveError([FAILURE], {});
    expect(outcome).toEqual({
      status: 500,
      body: { code: "GATEWAY_FAILURE", reason: "Connection refused" },
    });
  });

  it("uses the onFailure hook's status and message override when provided", () => {
    const outcome = resolveError([FAILURE], { onFailure: () => [503, "service unavailable"] });
    expect(outcome).toEqual({
      status: 503,
      body: { code: "GATEWAY_FAILURE", reason: "service unavailable" },
    });
  });
});
