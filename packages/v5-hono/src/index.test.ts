import { Hono } from "hono";
import { z } from "zod";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { PipelineEnv } from "./index.ts";
import {
  parseJsonBodyMiddleware,
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  toCommandMiddleware,
  toQueryMiddleware,
} from "./index.ts";

describe("parseJsonBodyMiddleware", () => {
  const schema = z.object({ name: z.string() });

  function buildApp() {
    const app = new Hono<PipelineEnv>();
    app.onError((err, c) => c.json({ error: String(err) }, 400));
    app.use(parseJsonBodyMiddleware(schema));
    app.post("/", async (c) => c.json({ payload: c.get("payload") }));
    return app;
  }

  it("sets the parsed payload on the context for valid JSON", async () => {
    const res = await buildApp().request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ payload: { name: "John" } });
  });

  it("is caught by onError for invalid JSON body", async () => {
    const res = await buildApp().request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("is caught by onError when the body is absent", async () => {
    const res = await buildApp().request("/", { method: "POST" });
    expect(res.status).toBe(400);
  });
});

describe("parseQueryMiddleware", () => {
  const schema = z.object({ status: z.enum(["open", "closed"]).optional() });

  function buildApp() {
    const app = new Hono<PipelineEnv>();
    app.onError((err, c) => c.json({ error: String(err) }, 400));
    app.use(parseQueryMiddleware(schema));
    app.get("/", async (c) => c.json({ payload: c.get("payload") }));
    return app;
  }

  it("sets the parsed payload on the context for valid query params", async () => {
    const res = await buildApp().request("/?status=open");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ payload: { status: "open" } });
  });

  it("defaults to an empty object when there are no query params at all", async () => {
    const res = await buildApp().request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ payload: {} });
  });

  it("is caught by onError for invalid query params", async () => {
    const res = await buildApp().request("/?status=bogus");
    expect(res.status).toBe(400);
  });

  it("defaults to an empty object when c.req.query() itself returns undefined", async () => {
    const set = vi.fn();
    const fakeContext = { req: { query: () => undefined }, set } as unknown as Parameters<
      ReturnType<typeof parseQueryMiddleware>
    >[0];
    await parseQueryMiddleware(schema)(fakeContext, async () => {});
    expect(set).toHaveBeenCalledWith("payload", {});
  });
});

describe("correlationIdMiddleware", () => {
  function buildApp(options?: Parameters<typeof correlationIdMiddleware>[0]) {
    const app = new Hono<PipelineEnv>();
    app.use(correlationIdMiddleware(options));
    app.get("/", async (c) => c.json({ correlationId: c.get("correlationId") }));
    return app;
  }

  it("sets the correlationId from the x-correlation-id header", async () => {
    const res = await buildApp().request("/", { headers: { "x-correlation-id": "abc-123" } });
    expect((await res.json()).correlationId).toBe("abc-123");
  });

  it("generates a correlationId when the header is absent", async () => {
    const res = await buildApp().request("/");
    expect((await res.json()).correlationId).toEqual(expect.any(String));
  });

  it("honours custom options", async () => {
    const res = await buildApp({ idFactory: () => "fixed" }).request("/");
    expect((await res.json()).correlationId).toBe("fixed");
  });
});

describe("causationIdMiddleware", () => {
  function buildApp(options?: Parameters<typeof causationIdMiddleware>[0]) {
    const app = new Hono<PipelineEnv>();
    app.use(causationIdMiddleware(options));
    app.get("/", async (c) => c.json({ causationId: c.get("causationId") }));
    return app;
  }

  it("sets the causationId from the x-request-id header", async () => {
    const res = await buildApp().request("/", { headers: { "x-request-id": "req-123" } });
    expect((await res.json()).causationId).toBe("req-123");
  });

  it("generates a causationId when the header is absent", async () => {
    const res = await buildApp().request("/");
    expect((await res.json()).causationId).toEqual(expect.any(String));
  });

  it("honours custom options", async () => {
    const res = await buildApp({ idFactory: () => "fixed" }).request("/");
    expect((await res.json()).causationId).toBe("fixed");
  });
});

describe("toCommandMiddleware", () => {
  interface TestPayload {
    name: string;
  }

  function toTestCommand(payload: TestPayload, metadata: Metadata) {
    return {
      id: "cmd-1",
      type: "TestCommand" as const,
      kind: "command" as const,
      payload,
      metadata,
      timestamp: 0,
    };
  }

  function buildApp() {
    const app = new Hono<PipelineEnv>();
    app.use(async (c, next) => {
      c.set("payload", { name: "John" });
      await next();
    });
    app.use(correlationIdMiddleware());
    app.use(causationIdMiddleware());
    app.use(toCommandMiddleware(toTestCommand));
    app.get("/", async (c) => c.json({ command: c.get("command") }));
    return app;
  }

  it("sets the command built from payload and metadata on the context", async () => {
    const res = await buildApp().request("/", {
      headers: { "x-correlation-id": "corr-1", "x-request-id": "cause-1" },
    });
    expect(await res.json()).toEqual({
      command: {
        id: "cmd-1",
        type: "TestCommand",
        kind: "command",
        payload: { name: "John" },
        metadata: { correlationId: "corr-1", causationId: "cause-1" },
        timestamp: 0,
      },
    });
  });
});

describe("toQueryMiddleware", () => {
  interface TestPayload {
    status?: string;
  }

  function toTestQuery(payload: TestPayload, metadata: Metadata) {
    return {
      id: "qry-1",
      type: "TestQuery" as const,
      kind: "query" as const,
      payload,
      metadata,
      timestamp: 0,
    };
  }

  function buildApp() {
    const app = new Hono<PipelineEnv>();
    app.use(async (c, next) => {
      c.set("payload", { status: "open" });
      await next();
    });
    app.use(correlationIdMiddleware());
    app.use(causationIdMiddleware());
    app.use(toQueryMiddleware(toTestQuery));
    app.get("/", async (c) => c.json({ query: c.get("query") }));
    return app;
  }

  it("sets the query built from payload and metadata on the context", async () => {
    const res = await buildApp().request("/", {
      headers: { "x-correlation-id": "corr-2", "x-request-id": "cause-2" },
    });
    expect(await res.json()).toEqual({
      query: {
        id: "qry-1",
        type: "TestQuery",
        kind: "query",
        payload: { status: "open" },
        metadata: { correlationId: "corr-2", causationId: "cause-2" },
        timestamp: 0,
      },
    });
  });
});
