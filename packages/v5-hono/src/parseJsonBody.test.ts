import { Hono } from "hono";
import { parseJsonBody } from "./parseJsonBody.ts";

describe("parseJsonBody", () => {
  function buildApp() {
    const app = new Hono();
    app.post("/", async (c) => {
      const result = await parseJsonBody(c);
      return result.match(
        (data) => c.json(data),
        (err) => c.json(err),
      );
    });
    return app;
  }

  it("parses a valid JSON body", async () => {
    const res = await buildApp().request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John" }),
    });
    expect(await res.json()).toEqual({ name: "John" });
  });

  it("yields JSONParseError for a malformed body", async () => {
    const res = await buildApp().request("/", { method: "POST" });
    const json = await res.json();
    expect(json.name).toBe("JSONParseError");
  });

  it("yields undefined for an absent body", async () => {
    const res = await buildApp().request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    expect(json.name).toBe("NoBodyError");
  });
});
