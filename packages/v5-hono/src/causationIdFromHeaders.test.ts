import { causationIdFromHeaders } from "./causationIdFromHeaders.ts";
import { Context, Hono } from "hono";
import { validate as isUuid } from "uuid";

describe("causationIdFromHeaders", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  function buildEndpoint(fn: ReturnType<typeof causationIdFromHeaders>) {
    app.post("/", async (c: Context) => {
      const result = fn(c);
      return result.match(
        (data) => c.json(data),
        (err) => c.json(err),
      );
    });
  }

  it("returns the x-causation-id header value when present", async () => {
    buildEndpoint(causationIdFromHeaders());
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-causation-id": "123" },
    });
    const json = await res.json();
    expect(json).toEqual({ causationId: "123" });
  });

  it("generates a UUIDv7 when the header is absent", async () => {
    buildEndpoint(causationIdFromHeaders());
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    expect(isUuid(json.causationId)).toBeTruthy();
  });

  it("uses a custom header name when provided", async () => {
    buildEndpoint(causationIdFromHeaders({ headerName: "x-my-causation" }));
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-my-causation": "custom" },
    });
    const json = await res.json();
    expect(json).toEqual({ causationId: "custom" });
  });

  it("uses a custom idFactory when provided", async () => {
    buildEndpoint(causationIdFromHeaders({ idFactory: () => "fixed-id" }));
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    expect(json).toEqual({ causationId: "fixed-id" });
  });
});
