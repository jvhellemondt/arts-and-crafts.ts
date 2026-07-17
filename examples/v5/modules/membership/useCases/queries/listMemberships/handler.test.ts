import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { randomUUID } from "node:crypto";
import { ListMembershipsHandler } from "./handler.ts";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import { listMembershipsQuery } from "./query.ts";

type Loader = LoadProjection<
  ListMembershipsProjection,
  ResultAsync<ListMembershipsProjection, GatewayFailure>
>;

const makeQuery = (status?: "open" | "initial" | "active" | "closed") =>
  listMembershipsQuery.parse({ status });

const makeSummary = (overrides: Partial<MembershipSummary> = {}): MembershipSummary => ({
  id: overrides.id ?? randomUUID(),
  name: overrides.name ?? "Ada Lovelace",
  email: overrides.email ?? "ada@example.com",
  status: "open",
});

const makeLoader = (state: ListMembershipsProjection): Loader => ({
  load: () => okAsync(state),
});

const makeFailingLoader = (failure: GatewayFailure): Loader => ({
  load: () => errAsync(failure),
});

describe("ListMembershipsHandler", () => {
  it("returns an empty list when the projection is empty", async () => {
    const handler = new ListMembershipsHandler(makeLoader({}));
    const result = (await handler.handle(makeQuery("open")))._unsafeUnwrap();
    expect(result).toEqual([]);
  });

  it("returns memberships matching the requested status", async () => {
    const a = makeSummary();
    const b = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [a.id]: a, [b.id]: b }));
    const result = (await handler.handle(makeQuery("open")))._unsafeUnwrap();
    expect(result).toEqual(expect.arrayContaining([a, b]));
    expect(result).toHaveLength(2);
  });

  it("returns an empty list when no memberships match the status filter", async () => {
    const a = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [a.id]: a }));
    const result = (await handler.handle(makeQuery("active")))._unsafeUnwrap();
    expect(result).toEqual([]);
  });

  it("returns all memberships when status is undefined", async () => {
    const state = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [state.id]: state }));
    const result = (await handler.handle(makeQuery()))._unsafeUnwrap();
    expect(result).toEqual([state]);
  });

  it("surfaces a GatewayFailure from the projection store", async () => {
    const failure: GatewayFailure = {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryProjectionStore",
      reason: "offline",
    };
    const handler = new ListMembershipsHandler(makeFailingLoader(failure));
    const result = (await handler.handle(makeQuery("open")))._unsafeUnwrapErr();
    expect(result).toEqual([failure]);
  });
});
