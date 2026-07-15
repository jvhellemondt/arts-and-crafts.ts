import { Hono } from "hono";
import type { Context } from "hono";
import type { PipelineOutcome } from "@arts-and-crafts/v5-utils/adapters/inbound";
import { readJsonBody, readQueryParams, readHeaders, respond } from "./index.ts";

describe("readJsonBody", () => {
  function buildApp() {
    const app = new Hono();
    app.post("/", async (c) => c.json({ body: (await readJsonBody(c)) ?? "<undefined>" }));
    return app;
  }

  it("parses a valid JSON body", async () => {
    const res = await buildApp().request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John" }),
    });
    expect(await res.json()).toEqual({ body: { name: "John" } });
  });

  it("yields undefined for an absent or malformed body", async () => {
    const res = await buildApp().request("/", { method: "POST" });
    expect(await res.json()).toEqual({ body: "<undefined>" });
  });
});

describe("readQueryParams", () => {
  function buildApp() {
    const app = new Hono();
    app.get("/", async (c) => c.json({ params: readQueryParams(c) }));
    return app;
  }

  it("returns the query-string parameters", async () => {
    const res = await buildApp().request("/?status=open");
    expect(await res.json()).toEqual({ params: { status: "open" } });
  });

  it("defaults to an empty object when c.req.query() returns undefined", () => {
    const fakeContext = { req: { query: () => undefined } } as unknown as Context;
    expect(readQueryParams(fakeContext)).toEqual({});
  });
});

describe("readHeaders", () => {
  function buildApp() {
    const app = new Hono();
    app.get("/", async (c) => c.json({ correlationId: readHeaders(c)["x-correlation-id"] }));
    return app;
  }

  it("returns the request headers", async () => {
    const res = await buildApp().request("/", { headers: { "x-correlation-id": "abc-123" } });
    expect(await res.json()).toEqual({ correlationId: "abc-123" });
  });
});

describe("respond", () => {
  function buildApp(outcome: PipelineOutcome) {
    const app = new Hono();
    app.get("/", (c) => respond(c, outcome));
    return app;
  }

  it("renders a PipelineOutcome as a JSON response with its status", async () => {
    const res = await buildApp({
      status: 503,
      body: { code: "GATEWAY_FAILURE", reason: "down" },
    }).request("/");
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ code: "GATEWAY_FAILURE", reason: "down" });
  });
});
