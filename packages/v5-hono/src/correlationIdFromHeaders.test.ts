import { correlationIdFromHeaders } from "./correlationIdFromHeaders.ts";
import { Context, Hono } from "hono";
import { validate as isUuid } from "uuid";

describe("correlationIdFromHeaders", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  function buildEndpoint(fn: ReturnType<typeof correlationIdFromHeaders>) {
    app.post("/", async (c: Context) => {
      const result = fn(c);
      return result.match(
        (data) => c.json(data),
        (err) => c.json(err),
      );
    });
  }

  it("returns the x-correlation-id header value when present", async () => {
    buildEndpoint(correlationIdFromHeaders());
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-correlation-id": "123" },
    });
    const json = await res.json();
    expect(json).toEqual({ correlationId: "123" });
  });

  it("generates a UUIDv7 when the header is absent", async () => {
    buildEndpoint(correlationIdFromHeaders());
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    expect(isUuid(json.correlationId)).toBeTruthy();
  });

  it("uses a custom header name when provided", async () => {
    buildEndpoint(correlationIdFromHeaders({ headerName: "x-my-correlation" }));
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-my-correlation": "custom" },
    });
    const json = await res.json();
    expect(json).toEqual({ correlationId: "custom" });
  });

  it("uses a custom idFactory when provided", async () => {
    buildEndpoint(correlationIdFromHeaders({ idFactory: () => "fixed-id" }));
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    expect(json).toEqual({ correlationId: "fixed-id" });
  });
});
