import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import { openMembershipHandlerRoute } from "./routes/membership.ts";

const http = new Hono();

http.use(
  compress(),
  cors(),
  csrf(),
  logger(),
  requestId(),
  secureHeaders(),
  timeout(5000),
  timing(),
  trimTrailingSlash(),
);

http.route("/", openMembershipHandlerRoute);

http.notFound((c) => {
  return c.text("Not found", 404);
});

http.onError((err, c) => {
  console.error(`${err}`);
  return c.text("Unexpected error", 500);
});

export { http };
